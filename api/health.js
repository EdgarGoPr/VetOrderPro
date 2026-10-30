import { getSql } from './_db.js';

export default async function handler(req, res) {
  try {
    const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
    if (!connectionString) {
      return res.status(200).json({
        status: 'warning',
        connected: false,
        message: 'DATABASE_URL no está configurada en las Variables de Entorno de Vercel.',
        provider: 'Local / Sin configurar',
      });
    }

    const sql = getSql();
    const result = await sql`SELECT COUNT(*)::int as count FROM users;`;
    const usersCount = result[0]?.count || 0;

    const host = new URL(connectionString).host;

    return res.status(200).json({
      status: 'ok',
      connected: true,
      provider: 'Neon Serverless PostgreSQL',
      host,
      usersCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      connected: false,
      error: error.message || 'Error al conectar con Neon',
    });
  }
}
