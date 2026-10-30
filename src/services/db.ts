import type { Account, Category, Order, Product, Supplier, User } from '../types';

const STORAGE_KEYS = {
  USERS: 'vetorder_users_v1',
  ACCOUNTS: 'vetorder_accounts_v1',
  PRODUCTS: 'vetorder_products_v1',
  ORDERS: 'vetorder_orders_v1',
  SUPPLIERS: 'vetorder_suppliers_v1',
  CATEGORIES: 'vetorder_categories_v1',
  AUTH_SESSION: 'vetorder_session_v1',
  ACTIVE_ACCOUNT: 'vetorder_active_account_id_v1',
};

// Initial Seed Users
const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    email: 'admin@vetorder.pro',
    nombre: 'Dr. Marcos Rossi',
    rol: 'admin',
    password: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-vet',
    email: 'veterinario@feedlot.com',
    nombre: 'Dra. Valentina Paz',
    rol: 'user',
    password: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813627-df790eb93051?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-campo',
    email: 'operaciones@campo.com',
    nombre: 'Ing. Roberto Méndez',
    rol: 'user',
    password: 'password123',
  },
];

// Initial Seed Accounts
const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-feedlot-acacias',
    nombre: 'Feedlot Las Acacias',
    tipo: 'Feedlot',
    iniciales: 'FLA',
    bajada: 'Establecimiento Ganadero y Engorde a Corral • Ruta 5 Km 142',
    miembros: ['usr-admin', 'usr-vet', 'usr-campo'],
    activo: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'acc-vet-sanroque',
    nombre: 'Veterinaria San Roque',
    tipo: 'Cliente',
    iniciales: 'VSR',
    bajada: 'Clínica y Sanidad Animal Mayor • Balcarce, Pcia. de Bs. As.',
    miembros: ['usr-admin', 'usr-vet'],
    activo: true,
    createdAt: '2026-02-01T11:30:00Z',
  },
  {
    id: 'acc-cabana-esperanza',
    nombre: 'Cabaña La Esperanza',
    tipo: 'Cabaña',
    iniciales: 'CLE',
    bajada: 'Cría, Recría y Genética Angus • Chascomús',
    miembros: ['usr-admin'],
    activo: true,
    createdAt: '2026-03-10T09:00:00Z',
  },
];

// Initial Seed Catalog (per account)
const INITIAL_PRODUCTS: Product[] = [
  // Feedlot Las Acacias Products
  {
    id: 'prod-fla-01',
    cuenta_id: 'acc-feedlot-acacias',
    nombre: 'Bioabortogen H',
    laboratorio: 'Biogénesis Bagó',
    categoria: 'Vacunas',
    presentacion: 'frasco 125 ml / 25 dosis',
    unidad: 'dosis',
    minimo: 25,
    paso: 25,
    activo: true,
  },
  {
    id: 'prod-fla-02',
    cuenta_id: 'acc-feedlot-acacias',
    nombre: 'Bagomisin 200 LA',
    laboratorio: 'Biogénesis Bagó',
    categoria: 'Antibióticos',
    presentacion: 'frasco 250 ml',
    unidad: 'unidad',
    minimo: 2,
    paso: 1,
    activo: true,
  },
  {
    id: 'prod-fla-03',
    cuenta_id: 'acc-feedlot-acacias',
    nombre: 'Flunixin Bagó',
    laboratorio: 'Biogénesis Bagó',
    categoria: 'Antiinflamatorios',
    presentacion: 'frasco 100 ml',
    unidad: 'unidad',
    minimo: 1,
    paso: 1,
    activo: true,
  },
  {
    id: 'prod-fla-04',
    cuenta_id: 'acc-feedlot-acacias',
    nombre: 'Bovilis Vista Once SQ',
    laboratorio: 'Zoetis',
    categoria: 'Vacunas',
    presentacion: 'frasco 10 dosis',
    unidad: 'dosis',
    minimo: 10,
    paso: 10,
    activo: true,
  },
  {
    id: 'prod-fla-05',
    cuenta_id: 'acc-feedlot-acacias',
    nombre: 'Draxxin 100 mg/ml',
    laboratorio: 'Zoetis',
    categoria: 'Antibióticos',
    presentacion: 'frasco 100 ml',
    unidad: 'unidad',
    minimo: 1,
    paso: 1,
    activo: true,
  },
  {
    id: 'prod-fla-06',
    cuenta_id: 'acc-feedlot-acacias',
    nombre: 'Dectomax Inyectable 1%',
    laboratorio: 'Zoetis',
    categoria: 'Antiparasitarios',
    presentacion: 'frasco 500 ml',
    unidad: 'unidad',
    minimo: 1,
    paso: 1,
    activo: true,
  },
  {
    id: 'prod-fla-07',
    cuenta_id: 'acc-feedlot-acacias',
    nombre: 'Metacam 20 mg/ml',
    laboratorio: 'Boehringer Ingelheim',
    categoria: 'Antiinflamatorios',
    presentacion: 'frasco 100 ml',
    unidad: 'unidad',
    minimo: 1,
    paso: 1,
    activo: true,
  },
  {
    id: 'prod-fla-08',
    cuenta_id: 'acc-feedlot-acacias',
    nombre: 'Ivomec Clásico',
    laboratorio: 'Boehringer Ingelheim',
    categoria: 'Antiparasitarios',
    presentacion: 'frasco 500 ml',
    unidad: 'unidad',
    minimo: 2,
    paso: 1,
    activo: true,
  },
  {
    id: 'prod-fla-09',
    cuenta_id: 'acc-feedlot-acacias',
    nombre: 'Resflor Gold Solución',
    laboratorio: 'MSD Salud Animal',
    categoria: 'Antibióticos',
    presentacion: 'frasco 250 ml',
    unidad: 'unidad',
    minimo: 1,
    paso: 1,
    activo: true,
  },
  {
    id: 'prod-fla-10',
    cuenta_id: 'acc-feedlot-acacias',
    nombre: 'Bovilis Bovipast RSP',
    laboratorio: 'MSD Salud Animal',
    categoria: 'Vacunas',
    presentacion: 'frasco 50 ml / 10 dosis',
    unidad: 'dosis',
    minimo: 10,
    paso: 10,
    activo: true,
  },
  {
    id: 'prod-fla-11',
    cuenta_id: 'acc-feedlot-acacias',
    nombre: 'Agujas descartables 18G x 1 1/2',
    laboratorio: 'Insumos Generales',
    categoria: 'Insumos',
    presentacion: 'caja x 100 unidades',
    unidad: 'caja',
    minimo: 1,
    paso: 1,
    activo: true,
  },
  {
    id: 'prod-fla-12',
    cuenta_id: 'acc-feedlot-acacias',
    nombre: 'Jeringa dosificadora Roux 50 ml',
    laboratorio: 'Insumos Generales',
    categoria: 'Insumos',
    presentacion: 'unidad metálica con repuestos',
    unidad: 'unidad',
    minimo: 1,
    paso: 1,
    activo: true,
  },
  // Veterinaria San Roque Products
  {
    id: 'prod-vsr-01',
    cuenta_id: 'acc-vet-sanroque',
    nombre: 'Rotavec Corona',
    laboratorio: 'MSD Salud Animal',
    categoria: 'Vacunas',
    presentacion: 'frasco 100 ml',
    unidad: 'unidad',
    minimo: 1,
    paso: 1,
    activo: true,
  },
  {
    id: 'prod-vsr-02',
    cuenta_id: 'acc-vet-sanroque',
    nombre: 'Flunixin Meglumina',
    laboratorio: 'Biogénesis Bagó',
    categoria: 'Antiinflamatorios',
    presentacion: 'frasco 50 ml',
    unidad: 'unidad',
    minimo: 2,
    paso: 1,
    activo: true,
  },
  {
    id: 'prod-vsr-03',
    cuenta_id: 'acc-vet-sanroque',
    nombre: 'Synanthic 9.06%',
    laboratorio: 'Zoetis',
    categoria: 'Antiparasitarios',
    presentacion: 'bidón 5 litros',
    unidad: 'unidad',
    minimo: 1,
    paso: 1,
    activo: true,
  },
];

// Initial Seed Suppliers (Laboratorios / Proveedores)
const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-fla-01',
    cuenta_id: 'acc-feedlot-acacias',
    nombre: 'Zoetis',
    contacto: 'Dr. Alejandro Dupont',
    telefono: '+54 9 11 4455-8899',
    email: 'pedidos@zoetis.com.ar',
    direccion: 'Av. Libertador 6250, CABA',
    notas: 'Proveedor principal de biológicos y antibióticos de alta exigencia.',
    activo: true,
  },
  {
    id: 'sup-fla-02',
    cuenta_id: 'acc-feedlot-acacias',
    nombre: 'Biogénesis Bagó',
    contacto: 'Dra. Mariana Solís',
    telefono: '+54 9 11 5566-7788',
    email: 'ventas@biogenesisbago.com',
    direccion: 'Ruta Panamericana Km 38.5, Garín',
    notas: 'Cadena de frío estricta para vacunas reproductivas.',
    activo: true,
  },
  {
    id: 'sup-fla-03',
    cuenta_id: 'acc-feedlot-acacias',
    nombre: 'MSD Salud Animal',
    contacto: 'Ing. Lucas Varela',
    telefono: '+54 9 11 3344-9900',
    email: 'contacto.ganaderia@msd.com',
    direccion: 'Parque Industrial Pilar',
    notas: 'Entregas semanales los días martes y jueves.',
    activo: true,
  },
  {
    id: 'sup-fla-04',
    cuenta_id: 'acc-feedlot-acacias',
    nombre: 'Boehringer Ingelheim',
    contacto: 'Valeria Rossi',
    telefono: '+54 9 11 2233-4455',
    email: 'atencion@boehringer-ingelheim.com',
    direccion: 'Av. del Libertador 7208',
    notas: 'Línea Metacam e Ivomec.',
    activo: true,
  },
  {
    id: 'sup-fla-05',
    cuenta_id: 'acc-feedlot-acacias',
    nombre: 'Insumos Generales',
    contacto: 'Depósito Central',
    telefono: '+54 9 2346 55-1234',
    email: 'deposito@feedlot-insumos.com',
    notas: 'Material descartable, agujas y jeringas.',
    activo: true,
  },
  {
    id: 'sup-vsr-01',
    cuenta_id: 'acc-vet-sanroque',
    nombre: 'MSD Salud Animal',
    contacto: 'Distribuidora del Sud',
    telefono: '+54 9 2266 42-8800',
    email: 'pedidos@distribuidoradelsud.com',
    activo: true,
  },
  {
    id: 'sup-vsr-02',
    cuenta_id: 'acc-vet-sanroque',
    nombre: 'Biogénesis Bagó',
    contacto: 'Representante Balcarce',
    telefono: '+54 9 2266 43-1122',
    email: 'bago.balcarce@agroveterinaria.com',
    activo: true,
  },
  {
    id: 'sup-vsr-03',
    cuenta_id: 'acc-vet-sanroque',
    nombre: 'Zoetis',
    contacto: 'Agencia Tandil',
    telefono: '+54 9 249 444-5566',
    email: 'tandil@zoetis.com.ar',
    activo: true,
  },
];

// Initial Seed Categories
const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-01', cuenta_id: 'acc-feedlot-acacias', nombre: 'Vacunas', descripcion: 'Biológicos y preventivos', color: '#059669', activo: true },
  { id: 'cat-02', cuenta_id: 'acc-feedlot-acacias', nombre: 'Antibióticos', descripcion: 'Tratamientos antimicrobianos', color: '#0284c7', activo: true },
  { id: 'cat-03', cuenta_id: 'acc-feedlot-acacias', nombre: 'Antiinflamatorios', descripcion: 'Analgésicos y antipiréticos', color: '#d97706', activo: true },
  { id: 'cat-04', cuenta_id: 'acc-feedlot-acacias', nombre: 'Antiparasitarios', descripcion: 'Endectocidas e inmunidad', color: '#7c3aed', activo: true },
  { id: 'cat-05', cuenta_id: 'acc-feedlot-acacias', nombre: 'Insumos', descripcion: 'Descartables, jeringas y equipos', color: '#57534e', activo: true },
  { id: 'cat-06', cuenta_id: 'acc-feedlot-acacias', nombre: 'Otros', descripcion: 'Varios y accesorios', color: '#475569', activo: true },
  // Categories for San Roque
  { id: 'cat-vsr-01', cuenta_id: 'acc-vet-sanroque', nombre: 'Vacunas', activo: true },
  { id: 'cat-vsr-02', cuenta_id: 'acc-vet-sanroque', nombre: 'Antibióticos', activo: true },
  { id: 'cat-vsr-03', cuenta_id: 'acc-vet-sanroque', nombre: 'Antiinflamatorios', activo: true },
  { id: 'cat-vsr-04', cuenta_id: 'acc-vet-sanroque', nombre: 'Antiparasitarios', activo: true },
  { id: 'cat-vsr-05', cuenta_id: 'acc-vet-sanroque', nombre: 'Insumos', activo: true },
  { id: 'cat-vsr-06', cuenta_id: 'acc-vet-sanroque', nombre: 'Otros', activo: true },
];

// Helper to get current YYYY-MM
function getCurrentYearMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return { nowIso: now.toISOString(), todayDate: `${year}-${month}-${day}`, yearMonth: `${year}-${month}` };
}

const { todayDate, yearMonth } = getCurrentYearMonth();

// Initial Seed Orders for Feedlot Las Acacias
const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-fla-001',
    numero: 'OC-2026-0045',
    cuenta_id: 'acc-feedlot-acacias',
    laboratorio: 'Zoetis',
    fecha: todayDate,
    estado: 'Emitida',
    items: [
      {
        producto_id: 'prod-fla-04',
        nombre: 'Bovilis Vista Once SQ',
        presentacion: 'frasco 10 dosis',
        unidad: 'dosis',
        cantidad: 60,
        minimo: 10,
        paso: 10,
        laboratorio: 'Zoetis',
      },
      {
        producto_id: 'prod-fla-05',
        nombre: 'Draxxin 100 mg/ml',
        presentacion: 'frasco 100 ml',
        unidad: 'unidad',
        cantidad: 3,
        minimo: 1,
        paso: 1,
        laboratorio: 'Zoetis',
      },
      {
        producto_id: 'prod-fla-06',
        nombre: 'Dectomax Inyectable 1%',
        presentacion: 'frasco 500 ml',
        unidad: 'unidad',
        cantidad: 2,
        minimo: 1,
        paso: 1,
        laboratorio: 'Zoetis',
      },
    ],
    observaciones: 'Entregar antes de las 14hs en manga principal. Coordinar con capataz.',
    createdAt: `${yearMonth}-28T14:30:00Z`,
  },
  {
    id: 'ord-fla-002',
    numero: 'OC-2026-0044',
    cuenta_id: 'acc-feedlot-acacias',
    laboratorio: 'Biogénesis Bagó',
    fecha: `${yearMonth}-20`,
    estado: 'Enviada',
    items: [
      {
        producto_id: 'prod-fla-01',
        nombre: 'Bioabortogen H',
        presentacion: 'frasco 125 ml / 25 dosis',
        unidad: 'dosis',
        cantidad: 150,
        minimo: 25,
        paso: 25,
        laboratorio: 'Biogénesis Bagó',
      },
      {
        producto_id: 'prod-fla-02',
        nombre: 'Bagomisin 200 LA',
        presentacion: 'frasco 250 ml',
        unidad: 'unidad',
        cantidad: 5,
        minimo: 2,
        paso: 1,
        laboratorio: 'Biogénesis Bagó',
      },
      {
        producto_id: 'prod-fla-03',
        nombre: 'Flunixin Bagó',
        presentacion: 'frasco 100 ml',
        unidad: 'unidad',
        cantidad: 2,
        minimo: 1,
        paso: 1,
        laboratorio: 'Biogénesis Bagó',
      },
    ],
    observaciones: 'Mantener cadena de frío para vacuna Bioabortogen (2°C a 8°C).',
    createdAt: `${yearMonth}-20T10:15:00Z`,
  },
  {
    id: 'ord-fla-003',
    numero: 'OC-2026-0043',
    cuenta_id: 'acc-feedlot-acacias',
    laboratorio: 'MSD Salud Animal',
    fecha: `${yearMonth}-12`,
    estado: 'Recibida',
    items: [
      {
        producto_id: 'prod-fla-09',
        nombre: 'Resflor Gold Solución',
        presentacion: 'frasco 250 ml',
        unidad: 'unidad',
        cantidad: 4,
        minimo: 1,
        paso: 1,
        laboratorio: 'MSD Salud Animal',
      },
      {
        producto_id: 'prod-fla-10',
        nombre: 'Bovilis Bovipast RSP',
        presentacion: 'frasco 50 ml / 10 dosis',
        unidad: 'dosis',
        cantidad: 40,
        minimo: 10,
        paso: 10,
        laboratorio: 'MSD Salud Animal',
      },
    ],
    observaciones: 'Pedido recibido conforme en depósito veterinario.',
    createdAt: `${yearMonth}-12T09:00:00Z`,
  },
  {
    id: 'ord-fla-004',
    numero: 'OC-2026-0038',
    cuenta_id: 'acc-feedlot-acacias',
    laboratorio: '', // General order without specific lab
    fecha: '2026-09-25',
    estado: 'Recibida',
    items: [
      {
        producto_id: 'prod-fla-11',
        nombre: 'Agujas descartables 18G x 1 1/2',
        presentacion: 'caja x 100 unidades',
        unidad: 'caja',
        cantidad: 5,
        minimo: 1,
        paso: 1,
        laboratorio: 'Insumos Generales',
      },
      {
        producto_id: 'prod-fla-12',
        nombre: 'Jeringa dosificadora Roux 50 ml',
        presentacion: 'unidad metálica con repuestos',
        unidad: 'unidad',
        cantidad: 2,
        minimo: 1,
        paso: 1,
        laboratorio: 'Insumos Generales',
      },
    ],
    observaciones: 'Pedido general de insumos para campaña de vacunación de primavera.',
    createdAt: '2026-09-25T11:00:00Z',
  },
  // Order for San Roque
  {
    id: 'ord-vsr-001',
    numero: 'OC-2026-0012',
    cuenta_id: 'acc-vet-sanroque',
    laboratorio: 'MSD Salud Animal',
    fecha: todayDate,
    estado: 'Emitida',
    items: [
      {
        producto_id: 'prod-vsr-01',
        nombre: 'Rotavec Corona',
        presentacion: 'frasco 100 ml',
        unidad: 'unidad',
        cantidad: 3,
        minimo: 1,
        paso: 1,
        laboratorio: 'MSD Salud Animal',
      },
    ],
    observaciones: 'Facturar a nombre de Veterinaria San Roque SRL.',
    createdAt: `${yearMonth}-29T08:00:00Z`,
  },
];

/**
 * Storage Engine Wrapper
 */
export const db = {
  // Initialization
  init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(INITIAL_ACCOUNTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) {
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    }
    // Default session if none exists
    if (!localStorage.getItem(STORAGE_KEYS.AUTH_SESSION)) {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(INITIAL_USERS[0]));
    }
    // Default active account if none exists
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT, INITIAL_ACCOUNTS[0].id);
    }
  },

  resetToDefaults(): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(INITIAL_ACCOUNTS));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(INITIAL_USERS[0]));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT, INITIAL_ACCOUNTS[0].id);
  },

  // USERS
  getUsers(): User[] {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  // ACCOUNTS
  getAccounts(): Account[] {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      return data ? JSON.parse(data) : INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  },

  saveAccounts(accounts: Account[]): void {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  // PRODUCTS
  getProducts(): Product[] {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return data ? JSON.parse(data) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  },

  saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  // ORDERS
  getOrders(): Order[] {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return data ? JSON.parse(data) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  },

  saveOrders(orders: Order[]): void {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  },

  // AUTH SESSION
  getSession(): User | null {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setSession(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    }
  },

  // ACTIVE ACCOUNT
  getActiveAccountId(): string | null {
    this.init();
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT);
  },

  setActiveAccountId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT, id);
  },

  // SUPPLIERS
  getSuppliers(): Supplier[] {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      return data ? JSON.parse(data) : INITIAL_SUPPLIERS;
    } catch {
      return INITIAL_SUPPLIERS;
    }
  },

  saveSuppliers(suppliers: Supplier[]): void {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  },

  // CATEGORIES
  getCategories(): Category[] {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  },

  saveCategories(categories: Category[]): void {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },
};
