import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usamos la URL no-pooleada para DDL/migraciones o la directa con SSL
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL no encontrada en las variables de entorno.');
  process.exit(1);
}

console.log('🔌 Conectando a Neon PostgreSQL...');
console.log(`📡 Host: ${new URL(connectionString).host}`);

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Conexión establecida con éxito a Neon.');

    // 1. Leer y ejecutar schema.sql
    console.log('\n📄 Leyendo database/schema.sql...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('⚡ Ejecutando schema.sql en Neon...');
    await client.query(schemaSql);
    console.log('✅ Esquema creado con éxito.');

    // 2. Leer y ejecutar seed.sql
    console.log('\n🌱 Leyendo database/seed.sql...');
    const seedPath = path.join(__dirname, 'seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('⚡ Insertando datos iniciales (seed)...');
    await client.query(seedSql);
    console.log('✅ Datos iniciales cargados con éxito.');

    // 3. Verificación
    console.log('\n🔍 Verificando datos cargados en Neon:');

    const usersRes = await client.query('SELECT COUNT(*)::int as count FROM users;');
    console.log(`   👤 Usuarios: ${usersRes.rows[0].count}`);

    const accountsRes = await client.query('SELECT COUNT(*)::int as count FROM accounts;');
    console.log(`   🏢 Cuentas: ${accountsRes.rows[0].count}`);

    const membersRes = await client.query('SELECT COUNT(*)::int as count FROM account_members;');
    console.log(`   🤝 Miembros en cuentas: ${membersRes.rows[0].count}`);

    const suppliersRes = await client.query('SELECT COUNT(*)::int as count FROM suppliers;');
    console.log(`   🏭 Proveedores: ${suppliersRes.rows[0].count}`);

    const categoriesRes = await client.query('SELECT COUNT(*)::int as count FROM categories;');
    console.log(`   🏷️  Categorías: ${categoriesRes.rows[0].count}`);

    const productsRes = await client.query('SELECT COUNT(*)::int as count FROM products;');
    console.log(`   💊 Insumos/Catálogo: ${productsRes.rows[0].count}`);

    const ordersRes = await client.query('SELECT COUNT(*)::int as count FROM orders;');
    console.log(`   📋 Órdenes de compra: ${ordersRes.rows[0].count}`);

    const itemsRes = await client.query('SELECT COUNT(*)::int as count FROM order_items;');
    console.log(`   📝 Renglones de órdenes: ${itemsRes.rows[0].count}`);

    console.log('\n🎉 ¡Estructura y datos desplegados exitosamente en NEON!');
  } catch (error) {
    console.error('\n❌ Error durante la migración a Neon:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
