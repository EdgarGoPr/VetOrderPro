export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  password?: string;
  avatarUrl?: string;
}

export type AccountType = 'Feedlot' | 'Cliente' | 'Personal' | 'Cabaña' | 'Haras' | 'Veterinaria';

export interface Account {
  id: string;
  nombre: string;
  tipo: AccountType;
  iniciales: string;
  bajada: string;
  miembros: string[]; // User IDs
  activo: boolean;
  createdAt: string;
}

export interface Supplier {
  id: string;
  cuenta_id: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
  activo: boolean;
  createdAt?: string;
}

export interface Category {
  id: string;
  cuenta_id: string;
  nombre: string;
  descripcion?: string;
  color?: string;
  activo: boolean;
  createdAt?: string;
}

export type ProductCategory = string;

export type ProductUnit = 'unidad' | 'caja' | 'dosis';

export interface Product {
  id: string;
  cuenta_id: string;
  nombre: string;
  laboratorio: string;
  categoria: ProductCategory;
  presentacion: string; // e.g. "50 ml", "frasco 2 ml", "caja x 100"
  unidad: ProductUnit;
  minimo: number; // Cantidad mínima que acepta el laboratorio
  paso: number; // Incremento permitido al sumar o restar
  activo: boolean;
  createdAt?: string;
}

export interface OrderItem {
  producto_id?: string | null;
  nombre: string;
  presentacion: string;
  unidad: ProductUnit;
  cantidad: number;
  minimo: number;
  paso: number;
  laboratorio: string;
}

export interface Order {
  id: string;
  numero: string; // e.g. "OC-0042"
  cuenta_id: string;
  laboratorio: string; // Vacío cuando el pedido es general / sin proveedor marcado
  fecha: string; // YYYY-MM-DD
  items: OrderItem[];
  observaciones?: string;
  estado?: 'Borrador' | 'Emitida' | 'Enviada' | 'Recibida';
  createdAt: string;
  updatedAt?: string;
}

export interface OrderMetrics {
  totalPedidos: number;
  pedidosMesActual: number;
  laboratoriosDistintos: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
