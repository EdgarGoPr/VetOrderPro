# Base de Datos PostgreSQL en NEON para VetOrder Pro

Este directorio contiene la arquitectura y los scripts listos para desplegar la base de datos de **VetOrder Pro** en [NEON Serverless PostgreSQL](https://neon.tech).

---

## 📁 Archivos Disponibles

- **`schema.sql`**: Definición completa del esquema DDL (Tablas, Claves Primarias y Foráneas en Cascada, Índices optimizados, Disparadores automáticos de fecha de actualización `updated_at`, Restricciones de Dominio y Vistas Analíticas para el Dashboard).
- **`seed.sql`**: Inserción de datos iniciales reales y completos (Usuarios administradores y veterinarios, Feedlots y clientes, Laboratorios proveedores, Categorías de insumos, Catálogo de productos y Órdenes de compra históricas con sus renglones de impresión).

---

## 🗄️ Modelo Relacional

```
[users] ────< [account_members] >──── [accounts]
                                          │
        ┌───────────────────┬─────────────┴─────────────┬────────────────────┐
        ▼                   ▼                           ▼                    ▼
   [suppliers]        [categories]                  [products]            [orders]
                                                        │                    │
                                                        └─────> [order_items] <┘
```

### Detalle de Tablas

1. **`users`**: Administradores y usuarios veterinarios/campo con control de roles (`admin`, `user`), contraseñas e imagen de perfil.
2. **`accounts`**: Entidades multi-cuenta (Feedlot, Cliente, Cabaña, Haras, etc.) con membrete e iniciales.
3. **`account_members`**: Relación N:M que define a qué cuentas tiene acceso cada usuario.
4. **`suppliers`**: Proveedores y laboratorios farmacológicos por cuenta con contactos, teléfonos y notas comerciales.
5. **`categories`**: Categorías personalizadas de insumos por cuenta (Vacunas, Antibióticos, Antiinflamatorios, etc.) con códigos de color.
6. **`products`**: Catálogo maestro de fármacos e insumos por cuenta con laboratorio, presentación, unidad (`unidad`, `caja`, `dosis`), mínimos de compra y múltiplos (paso).
7. **`orders`**: Cabeceras de órdenes de compra veterinarias numeradas (`OC-2026-0045`), fecha, cuenta, proveedor y estado.
8. **`order_items`**: Renglones inmutables de cada orden, con cantidades en números/enteros y orden de impresión optimizado para la grilla fija de 17 filas A4.

---

## 🚀 Paso a Paso: Despliegue en NEON

### 1. Crear el Proyecto en NEON
1. Ve a [neon.tech](https://neon.tech) e inicia sesión o crea una cuenta gratuita.
2. Haz clic en **"Create Project"**.
3. Asigna un nombre a tu proyecto (ej: `vetorder-pro`).
4. Selecciona la región más cercana (ej: `US East (Ohio)` o `US East (N. Virginia)`).
5. Selecciona la versión de PostgreSQL recomendada (**PostgreSQL 16** o 15).
6. Haz clic en **"Create Project"**.

### 2. Ejecutar el Esquema (`schema.sql`)
1. En el panel de control de tu proyecto en Neon, haz clic en la pestaña lateral **"SQL Editor"**.
2. Abre el archivo local [`database/schema.sql`](./schema.sql), copia todo su contenido y pégalo en el editor de Neon.
3. Haz clic en el botón verde **"Run"** (o presiona `Ctrl + Enter`).
4. Verás la confirmación de creación de todas las tablas, índices, disparadores y vistas.

### 3. Cargar los Datos Iniciales (`seed.sql`)
1. En el mismo **SQL Editor** de Neon, abre una nueva pestaña de consulta.
2. Abre el archivo local [`database/seed.sql`](./seed.sql), copia todo su contenido y pégalo en el editor.
3. Haz clic en **"Run"**.
4. ¡Listo! La base de datos ya tendrá los usuarios, laboratorios, insumos y pedidos listos para operar.

### 4. Obtener la Cadena de Conexión
1. En el **Dashboard** de Neon, ve a la sección **"Connection Details"**.
2. Asegúrate de tener seleccionado **"Connection string"** y activa la opción **"Pooled connection"** si vas a conectar desde Vercel o entornos Serverless.
3. Copia el string de conexión (tendrá un formato similar a: `postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require`).
4. Guárdalo en tu archivo `.env` o en las Variables de Entorno de Vercel como `DATABASE_URL`.

---

## 🔍 Consultas de Verificación Rápidas

Puedes ejecutar estas consultas en el SQL Editor de Neon para validar la carga:

```sql
-- Verificar cuentas y conteo de miembros
SELECT a.nombre, a.tipo, COUNT(m.user_id) AS total_miembros 
FROM accounts a 
LEFT JOIN account_members m ON a.id = m.account_id 
GROUP BY a.id, a.nombre, a.tipo;

-- Probar la vista de métricas del Dashboard
SELECT * FROM view_account_dashboard_metrics;

-- Listar productos por laboratorio en Feedlot Las Acacias
SELECT laboratorio, nombre, presentacion, unidad, minimo, paso 
FROM products 
WHERE cuenta_id = 'acc-feedlot-acacias'
ORDER BY laboratorio, nombre;
```
