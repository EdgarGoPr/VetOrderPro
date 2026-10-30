-- ==============================================================================
-- VetOrder Pro - Esquema de Base de Datos PostgreSQL para NEON
-- ==============================================================================
-- Motor: PostgreSQL 15+ / Neon Serverless Postgres
-- Arquitectura: Multi-cuenta, órdenes de compra veterinarias, catálogo e insumos.
-- ==============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Función disparadora para actualizar automáticamente 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Limpieza previa (opcional, para entornos de desarrollo / reset)
-- Descomentar si se desea reiniciar el esquema por completo:
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS suppliers CASCADE;
-- DROP TABLE IF EXISTS account_members CASCADE;
-- DROP TABLE IF EXISTS accounts CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ==============================================================================
-- TABLA: users (Usuarios del sistema)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (rol IN ('admin', 'user')),
    password_hash VARCHAR(255),
    avatar_url TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_rol ON users(rol);

-- ==============================================================================
-- TABLA: accounts (Cuentas: Feedlots, Clientes, Cabañas, etc.)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Feedlot', 'Cliente', 'Personal', 'Cabaña', 'Haras', 'Veterinaria')),
    iniciales VARCHAR(10) NOT NULL,
    bajada TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_activo ON accounts(activo);

-- ==============================================================================
-- TABLA: account_members (Membresía Usuario <-> Cuenta)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS account_members (
    account_id VARCHAR(64) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (account_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_account_members_user ON account_members(user_id);
CREATE INDEX IF NOT EXISTS idx_account_members_account ON account_members(account_id);

-- ==============================================================================
-- TABLA: suppliers (Proveedores y Laboratorios por cuenta)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    cuenta_id VARCHAR(64) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    contacto VARCHAR(255),
    telefono VARCHAR(100),
    email VARCHAR(255),
    direccion TEXT,
    notas TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_cuenta ON suppliers(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_nombre ON suppliers(cuenta_id, nombre);

-- ==============================================================================
-- TABLA: categories (Categorías de insumos por cuenta)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    cuenta_id VARCHAR(64) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    color VARCHAR(50) DEFAULT '#059669',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_cuenta ON categories(cuenta_id);

-- ==============================================================================
-- TABLA: products (Catálogo de insumos/fármacos por cuenta)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    cuenta_id VARCHAR(64) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    laboratorio VARCHAR(255) NOT NULL,
    categoria VARCHAR(255) NOT NULL,
    presentacion VARCHAR(255) NOT NULL,
    unidad VARCHAR(20) NOT NULL CHECK (unidad IN ('unidad', 'caja', 'dosis')),
    minimo INTEGER NOT NULL DEFAULT 1 CHECK (minimo > 0),
    paso INTEGER NOT NULL DEFAULT 1 CHECK (paso > 0),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_cuenta ON products(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_products_laboratorio ON products(cuenta_id, laboratorio);
CREATE INDEX IF NOT EXISTS idx_products_categoria ON products(cuenta_id, categoria);
CREATE INDEX IF NOT EXISTS idx_products_activo ON products(cuenta_id, activo);

-- ==============================================================================
-- TABLA: orders (Cabecera de Órdenes de Compra)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    numero VARCHAR(50) NOT NULL,
    cuenta_id VARCHAR(64) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    laboratorio VARCHAR(255) NOT NULL DEFAULT '',
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    observaciones TEXT,
    estado VARCHAR(50) NOT NULL DEFAULT 'Emitida' CHECK (estado IN ('Borrador', 'Emitida', 'Enviada', 'Recibida')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_cuenta ON orders(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_orders_fecha ON orders(cuenta_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_orders_laboratorio ON orders(cuenta_id, laboratorio);
CREATE INDEX IF NOT EXISTS idx_orders_numero ON orders(cuenta_id, numero);

-- ==============================================================================
-- TABLA: order_items (Renglones de la Orden de Compra - Soporta grilla fija de 17)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    producto_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
    nombre VARCHAR(255) NOT NULL,
    presentacion VARCHAR(255) NOT NULL,
    unidad VARCHAR(20) NOT NULL CHECK (unidad IN ('unidad', 'caja', 'dosis')),
    cantidad NUMERIC(10, 2) NOT NULL CHECK (cantidad > 0),
    minimo INTEGER NOT NULL DEFAULT 1,
    paso INTEGER NOT NULL DEFAULT 1,
    laboratorio VARCHAR(255) NOT NULL,
    orden INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id, orden);

-- ==============================================================================
-- DISPARADORES (Triggers) para auto-actualizar 'updated_at'
-- ==============================================================================
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_accounts_updated_at ON accounts;
CREATE TRIGGER trg_accounts_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_suppliers_updated_at ON suppliers;
CREATE TRIGGER trg_suppliers_updated_at
BEFORE UPDATE ON suppliers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- VISTAS ANALÍTICAS (Útiles para el Dashboard)
-- ==============================================================================
CREATE OR REPLACE VIEW view_account_dashboard_metrics AS
SELECT 
    a.id AS cuenta_id,
    a.nombre AS cuenta_nombre,
    COUNT(DISTINCT o.id) AS total_pedidos,
    COUNT(DISTINCT CASE 
        WHEN DATE_TRUNC('month', o.fecha) = DATE_TRUNC('month', CURRENT_DATE) 
        THEN o.id 
    END) AS pedidos_mes_actual,
    COUNT(DISTINCT NULLIF(o.laboratorio, '')) AS laboratorios_distintos
FROM accounts a
LEFT JOIN orders o ON o.cuenta_id = a.id
GROUP BY a.id, a.nombre;
