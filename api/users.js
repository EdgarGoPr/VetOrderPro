import { getSql } from './_db.js';

export default async function handler(req, res) {
  const method = req.method;

  try {
    const sql = getSql();

    // GET /api/users
    if (method === 'GET') {
      const rows = await sql`
        SELECT id, email, nombre, rol, avatar_url as "avatarUrl", activo, created_at as "createdAt"
        FROM users
        ORDER BY created_at ASC;
      `;
      return res.status(200).json(rows);
    }

    // POST /api/users (Create user)
    if (method === 'POST') {
      const { id, nombre, email, rol, password, assignToAccountId } = req.body || {};

      if (!nombre || !email) {
        return res.status(400).json({ error: 'Nombre y email son obligatorios.' });
      }

      const userId = id || `usr-${Date.now()}`;
      const cleanEmail = email.trim().toLowerCase();
      const userRol = rol || 'user';
      const passwordHash = password || 'password123';

      // Insert into users
      const inserted = await sql`
        INSERT INTO users (id, email, nombre, rol, password_hash, activo)
        VALUES (${userId}, ${cleanEmail}, ${nombre.trim()}, ${userRol}, ${passwordHash}, TRUE)
        ON CONFLICT (email) DO UPDATE SET
          nombre = EXCLUDED.nombre,
          rol = EXCLUDED.rol,
          password_hash = EXCLUDED.password_hash
        RETURNING id, email, nombre, rol, avatar_url as "avatarUrl", activo;
      `;

      // Assign to account if requested
      if (assignToAccountId) {
        await sql`
          INSERT INTO account_members (account_id, user_id)
          VALUES (${assignToAccountId}, ${userId})
          ON CONFLICT (account_id, user_id) DO NOTHING;
        `;
      }

      return res.status(201).json(inserted[0]);
    }

    // PUT /api/users (Update user)
    if (method === 'PUT') {
      const { id, nombre, email, rol, password, avatarUrl } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: 'ID de usuario requerido.' });
      }

      let updated;
      if (password) {
        updated = await sql`
          UPDATE users
          SET 
            nombre = COALESCE(${nombre ? nombre.trim() : null}, nombre),
            email = COALESCE(${email ? email.trim().toLowerCase() : null}, email),
            rol = COALESCE(${rol || null}, rol),
            password_hash = ${password},
            avatar_url = COALESCE(${avatarUrl || null}, avatar_url),
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING id, email, nombre, rol, avatar_url as "avatarUrl", activo;
        `;
      } else {
        updated = await sql`
          UPDATE users
          SET 
            nombre = COALESCE(${nombre ? nombre.trim() : null}, nombre),
            email = COALESCE(${email ? email.trim().toLowerCase() : null}, email),
            rol = COALESCE(${rol || null}, rol),
            avatar_url = COALESCE(${avatarUrl || null}, avatar_url),
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING id, email, nombre, rol, avatar_url as "avatarUrl", activo;
        `;
      }

      if (!updated.length) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      return res.status(200).json(updated[0]);
    }

    // DELETE /api/users
    if (method === 'DELETE') {
      const { id } = req.query || req.body || {};
      if (!id) {
        return res.status(400).json({ error: 'ID de usuario requerido.' });
      }

      await sql`DELETE FROM users WHERE id = ${id};`;
      return res.status(200).json({ success: true, message: 'Usuario eliminado.' });
    }

    return res.status(405).json({ error: `Método ${method} no permitido.` });
  } catch (error) {
    console.error('API Users Error:', error);
    return res.status(500).json({ error: error.message || 'Error del servidor en base de datos.' });
  }
}
