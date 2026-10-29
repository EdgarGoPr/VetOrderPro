import type { Account, Order, OrderMetrics, PaginatedResponse, Product, User } from '../types';
import { db } from './db';

// Simulate slight async network delay for realistic loading skeletons & UI feedback
const delay = (ms: number = 80) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  auth: {
    async getCurrentUser(): Promise<User | null> {
      await delay(40);
      return db.getSession();
    },

    async login(email: string, password?: string): Promise<User> {
      await delay(120);
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
      await delay(150);
      const users = db.getUsers();
      const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (existing) {
        throw new Error('Ya existe un usuario con este correo electrónico.');
      }

      const newUser: User = {
        id: `usr-${Date.now()}`,
        nombre,
        email: email.trim().toLowerCase(),
        rol: 'user', // Default role
        password: password || 'password123',
      };

      users.push(newUser);
      db.saveUsers(users);
      db.setSession(newUser);
      return newUser;
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
      await delay(60);
      return db.getUsers();
    },
  },

  accounts: {
    /**
     * Get accounts visible to the given user:
     * - Admin sees ALL accounts.
     * - User sees accounts where they are a member.
     *   (If they have no accounts assigned, they see all accounts).
     */
    async getVisibleAccounts(user: User | null): Promise<Account[]> {
      await delay(60);
      const all = db.getAccounts();
      if (!user) return [];

      if (user.rol === 'admin') {
        return all;
      }

      const userAccounts = all.filter(acc => acc.miembros && acc.miembros.includes(user.id));
      if (userAccounts.length === 0) {
        // If user is not assigned to any account, fallback to seeing all accounts as specified
        return all;
      }
      return userAccounts;
    },

    async getById(id: string): Promise<Account | null> {
      await delay(50);
      const accounts = db.getAccounts();
      return accounts.find(a => a.id === id) || null;
    },

    async create(accountData: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
      await delay(100);
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
      await delay(100);
      const accounts = db.getAccounts();
      const index = accounts.findIndex(a => a.id === id);
      if (index === -1) throw new Error('Cuenta no encontrada');
      
      accounts[index] = { ...accounts[index], ...data };
      db.saveAccounts(accounts);
      return accounts[index];
    },

    async delete(id: string): Promise<boolean> {
      await delay(100);
      let accounts = db.getAccounts();
      accounts = accounts.filter(a => a.id !== id);
      db.saveAccounts(accounts);

      // Also clean up or notify
      if (db.getActiveAccountId() === id) {
        const remaining = accounts[0];
        if (remaining) {
          db.setActiveAccountId(remaining.id);
        }
      }
      return true;
    },

    async assignMember(accountId: string, userId: string, action: 'add' | 'remove'): Promise<Account> {
      await delay(80);
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
      await delay(70);
      const all = db.getProducts();
      let filtered = all.filter(p => p.cuenta_id === accountId);

      if (filters?.activoOnly) {
        filtered = filtered.filter(p => p.activo !== false);
      }

      if (filters?.laboratorio && filters.laboratorio.trim()) {
        filtered = filtered.filter(
          p => p.laboratorio.toLowerCase() === filters.laboratorio!.toLowerCase().trim()
        );
      }

      if (filters?.categoria && filters.categoria.trim() && filters.categoria !== 'Todas') {
        filtered = filtered.filter(p => p.categoria === filters.categoria);
      }

      if (filters?.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        filtered = filtered.filter(
          p =>
            p.nombre.toLowerCase().includes(q) ||
            p.laboratorio.toLowerCase().includes(q) ||
            p.presentacion.toLowerCase().includes(q)
        );
      }

      return filtered;
    },

    async getById(id: string): Promise<Product | null> {
      await delay(40);
      const all = db.getProducts();
      return all.find(p => p.id === id) || null;
    },

    async create(productData: Omit<Product, 'id'>): Promise<Product> {
      await delay(100);
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
      await delay(90);
      const all = db.getProducts();
      const index = all.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Producto no encontrado');

      all[index] = { ...all[index], ...data };
      db.saveProducts(all);
      return all[index];
    },

    async delete(id: string): Promise<boolean> {
      await delay(80);
      let all = db.getProducts();
      all = all.filter(p => p.id !== id);
      db.saveProducts(all);
      return true;
    },
  },

  orders: {
    /**
     * Server-side paginated query for recent orders (up to 50 newest)
     */
    async getByAccount(
      accountId: string,
      options: {
        page?: number;
        limit?: number;
        search?: string;
        laboratorio?: string;
      } = {}
    ): Promise<PaginatedResponse<Order>> {
      await delay(100);
      const page = options.page || 1;
      const limit = options.limit || 50;

      const all = db.getOrders();
      let accountOrders = all.filter(o => o.cuenta_id === accountId);

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
            o.items.some(i => i.nombre.toLowerCase().includes(q))
        );
      }

      // Sort newest first by fecha and createdAt
      accountOrders.sort((a, b) => {
        const dateA = new Date(a.fecha + 'T12:00:00Z').getTime();
        const dateB = new Date(b.fecha + 'T12:00:00Z').getTime();
        if (dateB !== dateA) return dateB - dateA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const total = accountOrders.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const startIndex = (page - 1) * limit;
      const paginatedData = accountOrders.slice(startIndex, startIndex + limit);

      return {
        data: paginatedData,
        total,
        page,
        limit,
        totalPages,
      };
    },

    /**
     * Calculates metrics strictly on the server layer:
     * - total orders
     * - orders in current month
     * - distinct laboratories used in orders
     */
    async getMetrics(accountId: string): Promise<OrderMetrics> {
      await delay(90);
      const all = db.getOrders();
      const accountOrders = all.filter(o => o.cuenta_id === accountId);

      const totalPedidos = accountOrders.length;

      // Current Month calculation (YYYY-MM)
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-12

      let pedidosMesActual = 0;
      const labSet = new Set<string>();

      accountOrders.forEach(ord => {
        // Date format: YYYY-MM-DD
        if (ord.fecha) {
          const [yStr, mStr] = ord.fecha.split('-');
          const y = parseInt(yStr, 10);
          const m = parseInt(mStr, 10);
          if (y === currentYear && m === currentMonth) {
            pedidosMesActual++;
          }
        }

        // Distinct laboratories (including items' laboratories or order's laboratory)
        if (ord.laboratorio && ord.laboratorio.trim()) {
          labSet.add(ord.laboratorio.trim().toLowerCase());
        }
        ord.items.forEach(it => {
          if (it.laboratorio && it.laboratorio.trim()) {
            labSet.add(it.laboratorio.trim().toLowerCase());
          }
        });
      });

      return {
        totalPedidos,
        pedidosMesActual,
        laboratoriosDistintos: labSet.size,
      };
    },

    async getById(id: string): Promise<Order> {
      await delay(80);
      const all = db.getOrders();
      const order = all.find(o => o.id === id);
      if (!order) {
        // Real 404 simulation
        const err: any = new Error('No encontramos este pedido');
        err.statusCode = 404;
        throw err;
      }
      return order;
    },

    async create(orderData: Omit<Order, 'id' | 'numero' | 'createdAt'>): Promise<Order> {
      await delay(140);
      const all = db.getOrders();
      const year = new Date().getFullYear();
      const orderCountThisYear = all.filter(o => o.fecha.startsWith(String(year))).length + 1;
      const orderNumber = `OC-${year}-${String(orderCountThisYear).padStart(4, '0')}`;

      const newOrder: Order = {
        ...orderData,
        id: `ord-${Date.now()}`,
        numero: orderNumber,
        estado: 'Emitida',
        createdAt: new Date().toISOString(),
      };

      all.unshift(newOrder);
      db.saveOrders(all);
      return newOrder;
    },

    async update(id: string, data: Partial<Order>): Promise<Order> {
      await delay(120);
      const all = db.getOrders();
      const index = all.findIndex(o => o.id === id);
      if (index === -1) {
        const err: any = new Error('No encontramos este pedido para actualizar');
        err.statusCode = 404;
        throw err;
      }

      all[index] = {
        ...all[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      db.saveOrders(all);
      return all[index];
    },

    async delete(id: string): Promise<boolean> {
      await delay(100);
      let all = db.getOrders();
      const initialLen = all.length;
      all = all.filter(o => o.id !== id);
      if (all.length === initialLen) {
        const err: any = new Error('No encontramos este pedido');
        err.statusCode = 404;
        throw err;
      }
      db.saveOrders(all);
      return true;
    },
  },
};
