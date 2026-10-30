import type { Account, Category, Order, OrderMetrics, PaginatedResponse, Product, Supplier, User, UserRole } from '../types';
import { db } from './db';

// Simulate slight async network delay for realistic loading skeletons & UI feedback
const delay = (ms: number = 80) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to call Serverless API (Neon PostgreSQL) with graceful fallback to localStorage
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`/api/${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[Neon API] Solicitud /api/${endpoint} derivada al almacenamiento local:`, err);
    return null;
  }
}

export const api = {
  health: {
    async check(): Promise<{
      status: string;
      connected: boolean;
      provider: string;
      host?: string;
      usersCount?: number;
      message?: string;
    }> {
      const data = await fetchApi<any>('health');
      if (data) return data;
      return {
        status: 'warning',
        connected: false,
        provider: 'Navegador Local',
        message: 'No se pudo conectar con el endpoint /api/health.',
      };
    },
  },

  auth: {
    async getCurrentUser(): Promise<User | null> {
      await delay(40);
      return db.getSession();
    },

    async login(email: string, password?: string): Promise<User> {
      await delay(100);
      // Try to load fresh users from Neon
      const neonUsers = await fetchApi<User[]>('users');
      if (neonUsers && Array.isArray(neonUsers) && neonUsers.length > 0) {
        db.saveUsers(neonUsers);
      }

      const users = db.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      
      if (!user) {
        throw new Error('No existe un usuario registrado con este correo electrónico.');
      }
      
      if (password && user.password && user.password !== password) {
        throw new Error('Contraseña incorrecta. Por favor intente nuevamente.');
      }

      db.setSession(user);
      return user;
    },

    async register(nombre: string, email: string, password?: string): Promise<User> {
      await delay(120);
      const newUser = await this.createUser({
        nombre,
        email,
        rol: 'user',
        password: password || 'password123',
      });
      db.setSession(newUser);
      return newUser;
    },

    async createUser(data: {
      nombre: string;
      email: string;
      rol: UserRole;
      password?: string;
      assignToAccountId?: string;
    }): Promise<User> {
      await delay(100);

      // 1. Send to Neon Database
      const createdInNeon = await fetchApi<User>('users', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (createdInNeon) {
        const users = db.getUsers().filter(u => u.id !== createdInNeon.id);
        users.push(createdInNeon);
        db.saveUsers(users);

        if (data.assignToAccountId) {
          const accounts = db.getAccounts();
          const acc = accounts.find(a => a.id === data.assignToAccountId);
          if (acc) {
            if (!acc.miembros) acc.miembros = [];
            if (!acc.miembros.includes(createdInNeon.id)) {
              acc.miembros.push(createdInNeon.id);
              db.saveAccounts(accounts);
            }
          }
        }
        return createdInNeon;
      }

      // Fallback local storage
      const users = db.getUsers();
      const existing = users.find(u => u.email.toLowerCase() === data.email.toLowerCase().trim());
      if (existing) {
        throw new Error('Ya existe un usuario con este correo electrónico.');
      }

      const newUser: User = {
        id: `usr-${Date.now()}`,
        nombre: data.nombre.trim(),
        email: data.email.trim().toLowerCase(),
        rol: data.rol,
        password: data.password || 'password123',
      };

      users.push(newUser);
      db.saveUsers(users);
      return newUser;
    },

    async deleteUser(userId: string): Promise<boolean> {
      await delay(100);
      const currentSession = db.getSession();
      if (currentSession?.id === userId) {
        throw new Error('No puedes eliminar tu propio usuario en sesión activa.');
      }

      // 1. Delete in Neon
      await fetchApi(`users?id=${userId}`, { method: 'DELETE' });

      // 2. Delete locally
      let users = db.getUsers().filter(u => u.id !== userId);
      db.saveUsers(users);

      const accounts = db.getAccounts();
      accounts.forEach(acc => {
        if (acc.miembros && acc.miembros.includes(userId)) {
          acc.miembros = acc.miembros.filter(id => id !== userId);
        }
      });
      db.saveAccounts(accounts);

      return true;
    },

    async updateUser(
      userId: string,
      data: {
        nombre?: string;
        email?: string;
        rol?: UserRole;
        password?: string;
        avatarUrl?: string;
      }
    ): Promise<User> {
      await delay(100);

      // 1. Send update to Neon
      const updatedInNeon = await fetchApi<User>('users', {
        method: 'PUT',
        body: JSON.stringify({ id: userId, ...data }),
      });

      if (updatedInNeon) {
        const users = db.getUsers().map(u => u.id === userId ? { ...u, ...updatedInNeon } : u);
        db.saveUsers(users);
        const session = db.getSession();
        if (session && session.id === userId) {
          db.setSession(updatedInNeon);
        }
        return updatedInNeon;
      }

      // Fallback local
      const users = db.getUsers();
      const index = users.findIndex(u => u.id === userId);
      if (index === -1) {
        throw new Error('Usuario no encontrado.');
      }

      if (data.email) {
        const cleanEmail = data.email.trim().toLowerCase();
        const existing = users.find(u => u.email.toLowerCase() === cleanEmail && u.id !== userId);
        if (existing) {
          throw new Error('Ya existe otro usuario registrado con este correo electrónico.');
        }
        users[index].email = cleanEmail;
      }

      if (data.nombre !== undefined) users[index].nombre = data.nombre.trim();
      if (data.rol !== undefined) users[index].rol = data.rol;
      if (data.password && data.password.trim()) users[index].password = data.password.trim();
      if (data.avatarUrl !== undefined) users[index].avatarUrl = data.avatarUrl;

      const updatedUser = users[index];
      db.saveUsers(users);

      const session = db.getSession();
      if (session && session.id === userId) {
        db.setSession(updatedUser);
      }

      return updatedUser;
    },

    async updateProfile(
      userId: string,
      data: {
        nombre: string;
        email: string;
        currentPassword?: string;
        newPassword?: string;
        avatarUrl?: string;
      }
    ): Promise<User> {
      await delay(100);
      const users = db.getUsers();
      const index = users.findIndex(u => u.id === userId);
      const currentUser = index !== -1 ? users[index] : null;

      if (data.newPassword && data.newPassword.trim()) {
        if (currentUser?.password && data.currentPassword !== currentUser.password) {
          throw new Error('La contraseña actual ingresada es incorrecta.');
        }
      }

      return this.updateUser(userId, {
        nombre: data.nombre,
        email: data.email,
        password: data.newPassword,
        avatarUrl: data.avatarUrl,
      });
    },

    async recoverPassword(email: string): Promise<{ success: boolean; message: string; resetToken?: string }> {
      await delay(120);
      const users = db.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (!user) {
        throw new Error('No encontramos una cuenta asociada a este correo.');
      }
      return {
        success: true,
        message: `Se ha enviado el enlace de recuperación a ${email}.`,
        resetToken: `token-${Date.now()}`,
      };
    },

    async resetPassword(email: string, newPassword: string): Promise<boolean> {
      await delay(120);
      const users = db.getUsers();
      const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (index === -1) {
        throw new Error('Usuario no encontrado.');
      }
      users[index].password = newPassword;
      db.saveUsers(users);
      return true;
    },

    async logout(): Promise<void> {
      await delay(50);
      db.setSession(null);
    },

    async getAllUsers(): Promise<User[]> {
      const neonUsers = await fetchApi<User[]>('users');
      if (neonUsers && Array.isArray(neonUsers) && neonUsers.length > 0) {
        db.saveUsers(neonUsers);
        return neonUsers;
      }
      return db.getUsers();
    },
  },

  accounts: {
    async getVisibleAccounts(user: User | null): Promise<Account[]> {
      // 1. Try to fetch from Neon
      const neonAccounts = await fetchApi<Account[]>('accounts');
      if (neonAccounts && Array.isArray(neonAccounts) && neonAccounts.length > 0) {
        db.saveAccounts(neonAccounts);
        if (!user) return [];
        if (user.rol === 'admin') return neonAccounts;

        const userAccounts = neonAccounts.filter(acc => acc.miembros && acc.miembros.includes(user.id));
        return userAccounts.length === 0 ? neonAccounts : userAccounts;
      }

      // Fallback local
      const all = db.getAccounts();
      if (!user) return [];
      if (user.rol === 'admin') return all;

      const userAccounts = all.filter(acc => acc.miembros && acc.miembros.includes(user.id));
      return userAccounts.length === 0 ? all : userAccounts;
    },

    async getById(id: string): Promise<Account | null> {
      const accounts = db.getAccounts();
      return accounts.find(a => a.id === id) || null;
    },

    async create(accountData: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
      const created = await fetchApi<Account>('accounts', {
        method: 'POST',
        body: JSON.stringify(accountData),
      });

      if (created) {
        const accounts = db.getAccounts().filter(a => a.id !== created.id);
        accounts.push(created);
        db.saveAccounts(accounts);
        return created;
      }

      const accounts = db.getAccounts();
      const newAccount: Account = {
        ...accountData,
        id: `acc-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      accounts.push(newAccount);
      db.saveAccounts(accounts);
      return newAccount;
    },

    async update(id: string, data: Partial<Account>): Promise<Account> {
      const updated = await fetchApi<Account>('accounts', {
        method: 'PUT',
        body: JSON.stringify({ id, ...data }),
      });

      if (updated) {
        const accounts = db.getAccounts().map(a => a.id === id ? { ...a, ...updated } : a);
        db.saveAccounts(accounts);
        return updated;
      }

      const accounts = db.getAccounts();
      const index = accounts.findIndex(a => a.id === id);
      if (index === -1) throw new Error('Cuenta no encontrada');
      
      accounts[index] = { ...accounts[index], ...data };
      db.saveAccounts(accounts);
      return accounts[index];
    },

    async delete(id: string): Promise<boolean> {
      await fetchApi(`accounts?id=${id}`, { method: 'DELETE' });
      let accounts = db.getAccounts().filter(a => a.id !== id);
      db.saveAccounts(accounts);

      if (db.getActiveAccountId() === id && accounts[0]) {
        db.setActiveAccountId(accounts[0].id);
      }
      return true;
    },

    async assignMember(accountId: string, userId: string, action: 'add' | 'remove'): Promise<Account> {
      await fetchApi('accounts?action=member', {
        method: 'POST',
        body: JSON.stringify({
          accountId,
          userId,
          remove: action === 'remove',
        }),
      });

      const accounts = db.getAccounts();
      const index = accounts.findIndex(a => a.id === accountId);
      if (index === -1) throw new Error('Cuenta no encontrada');

      const miembros = accounts[index].miembros || [];
      if (action === 'add' && !miembros.includes(userId)) {
        miembros.push(userId);
      } else if (action === 'remove') {
        accounts[index].miembros = miembros.filter(id => id !== userId);
      }
      accounts[index].miembros = miembros;
      db.saveAccounts(accounts);
      return accounts[index];
    },
  },

  products: {
    async getByAccount(
      accountId: string,
      filters?: {
        search?: string;
        laboratorio?: string;
        categoria?: string;
        activoOnly?: boolean;
      }
    ): Promise<Product[]> {
      const neonProducts = await fetchApi<Product[]>(`products?cuenta_id=${accountId}`);
      let all = neonProducts && Array.isArray(neonProducts) ? neonProducts : db.getProducts().filter(p => p.cuenta_id === accountId);

      if (filters?.activoOnly) {
        all = all.filter(p => p.activo !== false);
      }
      if (filters?.laboratorio && filters.laboratorio.trim()) {
        all = all.filter(p => p.laboratorio.toLowerCase() === filters.laboratorio!.toLowerCase().trim());
      }
      if (filters?.categoria && filters.categoria.trim() && filters.categoria !== 'Todas') {
        all = all.filter(p => p.categoria === filters.categoria);
      }
      if (filters?.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        all = all.filter(
          p =>
            p.nombre.toLowerCase().includes(q) ||
            p.laboratorio.toLowerCase().includes(q) ||
            p.presentacion.toLowerCase().includes(q)
        );
      }

      return all;
    },

    async getById(id: string): Promise<Product | null> {
      const all = db.getProducts();
      return all.find(p => p.id === id) || null;
    },

    async create(productData: Omit<Product, 'id'>): Promise<Product> {
      const created = await fetchApi<Product>('products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });

      if (created) {
        const all = db.getProducts().filter(p => p.id !== created.id);
        all.unshift(created);
        db.saveProducts(all);
        return created;
      }

      const all = db.getProducts();
      const newProduct: Product = {
        ...productData,
        id: `prod-${Date.now()}`,
      };
      all.unshift(newProduct);
      db.saveProducts(all);
      return newProduct;
    },

    async update(id: string, data: Partial<Product>): Promise<Product> {
      const updated = await fetchApi<Product>('products', {
        method: 'PUT',
        body: JSON.stringify({ id, ...data }),
      });

      if (updated) {
        const all = db.getProducts().map(p => p.id === id ? { ...p, ...updated } : p);
        db.saveProducts(all);
        return updated;
      }

      const all = db.getProducts();
      const index = all.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Producto no encontrado');

      all[index] = { ...all[index], ...data };
      db.saveProducts(all);
      return all[index];
    },

    async delete(id: string): Promise<boolean> {
      await fetchApi(`products?id=${id}`, { method: 'DELETE' });
      let all = db.getProducts().filter(p => p.id !== id);
      db.saveProducts(all);
      return true;
    },
  },

  orders: {
    async getByAccount(
      accountId: string,
      options: {
        page?: number;
        limit?: number;
        search?: string;
        laboratorio?: string;
      } = {}
    ): Promise<PaginatedResponse<Order>> {
      const neonOrders = await fetchApi<Order[]>(`orders?cuenta_id=${accountId}`);
      let accountOrders = neonOrders && Array.isArray(neonOrders) ? neonOrders : db.getOrders().filter(o => o.cuenta_id === accountId);

      if (options.laboratorio && options.laboratorio.trim()) {
        accountOrders = accountOrders.filter(
          o => o.laboratorio.toLowerCase() === options.laboratorio!.toLowerCase().trim()
        );
      }

      if (options.search && options.search.trim()) {
        const q = options.search.toLowerCase().trim();
        accountOrders = accountOrders.filter(
          o =>
            o.numero.toLowerCase().includes(q) ||
            o.laboratorio.toLowerCase().includes(q) ||
            (o.observaciones && o.observaciones.toLowerCase().includes(q))
        );
      }

      const page = options.page || 1;
      const limit = options.limit || 50;
      const total = accountOrders.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const start = (page - 1) * limit;
      const data = accountOrders.slice(start, start + limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    },

    async getById(id: string): Promise<Order | undefined> {
      const neonOrder = await fetchApi<Order>(`orders?id=${id}`);
      if (neonOrder) return neonOrder;
      const all = db.getOrders();
      return all.find(o => o.id === id);
    },

    async getMetrics(accountId: string): Promise<OrderMetrics> {
      const res = await this.getByAccount(accountId, { limit: 1000 });
      const orders = res.data;

      const totalPedidos = orders.length;

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const yearMonthPrefix = `${currentYear}-${currentMonth}`;

      const pedidosMesActual = orders.filter(o => o.fecha.startsWith(yearMonthPrefix)).length;

      const labsSet = new Set(
        orders.map(o => o.laboratorio.trim()).filter(lab => lab.length > 0)
      );
      const laboratoriosDistintos = labsSet.size;

      return {
        totalPedidos,
        pedidosMesActual,
        laboratoriosDistintos,
      };
    },

    async create(orderData: Omit<Order, 'id' | 'numero' | 'estado' | 'createdAt'>): Promise<Order> {
      const year = new Date().getFullYear();
      const all = db.getOrders();
      const orderCountThisYear = all.filter(o => o.fecha.startsWith(String(year))).length + 1;
      const orderNumber = `OC-${year}-${String(orderCountThisYear).padStart(4, '0')}`;

      const payload = {
        ...orderData,
        numero: orderNumber,
        estado: 'Emitida' as const,
      };

      const created = await fetchApi<Order>('orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (created) {
        all.unshift(created);
        db.saveOrders(all);
        return created;
      }

      const newOrder: Order = {
        ...payload,
        id: `ord-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      all.unshift(newOrder);
      db.saveOrders(all);
      return newOrder;
    },

    async update(id: string, data: Partial<Order>): Promise<Order> {
      const updated = await fetchApi<Order>('orders', {
        method: 'PUT',
        body: JSON.stringify({ id, ...data }),
      });

      if (updated) {
        const all = db.getOrders().map(o => o.id === id ? { ...o, ...updated } : o);
        db.saveOrders(all);
        return updated;
      }

      const all = db.getOrders();
      const index = all.findIndex(o => o.id === id);
      if (index === -1) throw new Error('No encontramos este pedido');

      all[index] = { ...all[index], ...data, updatedAt: new Date().toISOString() };
      db.saveOrders(all);
      return all[index];
    },

    async delete(id: string): Promise<boolean> {
      await fetchApi(`orders?id=${id}`, { method: 'DELETE' });
      let all = db.getOrders().filter(o => o.id !== id);
      db.saveOrders(all);
      return true;
    },
  },

  suppliers: {
    async getByAccount(accountId: string): Promise<Supplier[]> {
      const neonSuppliers = await fetchApi<Supplier[]>(`suppliers?cuenta_id=${accountId}`);
      if (neonSuppliers && Array.isArray(neonSuppliers)) {
        return neonSuppliers;
      }
      return db.getSuppliers().filter(s => s.cuenta_id === accountId);
    },

    async getById(id: string): Promise<Supplier | null> {
      const all = db.getSuppliers();
      return all.find(s => s.id === id) || null;
    },

    async create(supplierData: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> {
      const created = await fetchApi<Supplier>('suppliers', {
        method: 'POST',
        body: JSON.stringify(supplierData),
      });

      if (created) {
        const all = db.getSuppliers().filter(s => s.id !== created.id);
        all.unshift(created);
        db.saveSuppliers(all);
        return created;
      }

      const all = db.getSuppliers();
      const newSupplier: Supplier = {
        ...supplierData,
        id: `sup-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      all.unshift(newSupplier);
      db.saveSuppliers(all);
      return newSupplier;
    },

    async update(id: string, data: Partial<Supplier>): Promise<Supplier> {
      const updated = await fetchApi<Supplier>('suppliers', {
        method: 'PUT',
        body: JSON.stringify({ id, ...data }),
      });

      if (updated) {
        const all = db.getSuppliers().map(s => s.id === id ? { ...s, ...updated } : s);
        db.saveSuppliers(all);
        return updated;
      }

      const all = db.getSuppliers();
      const index = all.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Proveedor no encontrado');

      all[index] = { ...all[index], ...data };
      db.saveSuppliers(all);
      return all[index];
    },

    async delete(id: string): Promise<boolean> {
      await fetchApi(`suppliers?id=${id}`, { method: 'DELETE' });
      let all = db.getSuppliers().filter(s => s.id !== id);
      db.saveSuppliers(all);
      return true;
    },
  },

  categories: {
    async getByAccount(accountId: string): Promise<Category[]> {
      const neonCategories = await fetchApi<Category[]>(`categories?cuenta_id=${accountId}`);
      if (neonCategories && Array.isArray(neonCategories)) {
        return neonCategories;
      }
      return db.getCategories().filter(c => c.cuenta_id === accountId);
    },

    async create(categoryData: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
      const created = await fetchApi<Category>('categories', {
        method: 'POST',
        body: JSON.stringify(categoryData),
      });

      if (created) {
        const all = db.getCategories().filter(c => c.id !== created.id);
        all.push(created);
        db.saveCategories(all);
        return created;
      }

      const all = db.getCategories();
      const newCat: Category = {
        ...categoryData,
        id: `cat-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      all.push(newCat);
      db.saveCategories(all);
      return newCat;
    },

    async update(id: string, data: Partial<Category>): Promise<Category> {
      const updated = await fetchApi<Category>('categories', {
        method: 'PUT',
        body: JSON.stringify({ id, ...data }),
      });

      if (updated) {
        const all = db.getCategories().map(c => c.id === id ? { ...c, ...updated } : c);
        db.saveCategories(all);
        return updated;
      }

      const all = db.getCategories();
      const index = all.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Categoría no encontrada');

      all[index] = { ...all[index], ...data };
      db.saveCategories(all);
      return all[index];
    },

    async delete(id: string): Promise<boolean> {
      await fetchApi(`categories?id=${id}`, { method: 'DELETE' });
      let all = db.getCategories().filter(c => c.id !== id);
      db.saveCategories(all);
      return true;
    },
  },
};
