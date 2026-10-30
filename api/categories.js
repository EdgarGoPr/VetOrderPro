import { getSql } from './_db.js';

export default async function handler(req, res) {
  const method = req.method;

  try {
    const sql = getSql();

    if (method === 'GET') {
      const { cuenta_id } = req.query || {};
      let targetCuentaId = cuenta_id;
      if (cuenta_id === '1' || cuenta_id === 1) {
        const accs = await sql`SELECT id FROM accounts ORDER BY created_at ASC LIMIT 1;`;
        if (accs.length > 0) targetCuentaId = accs[0].id;
      }

      let rows;
      if (targetCuentaId) {
        rows = await sql`
          SELECT id, cuenta_id, nombre, descripcion, color, activo, created_at as "createdAt"
          FROM categories
          WHERE cuenta_id = ${targetCuentaId}
          ORDER BY nombre ASC;
        `;
      } else {
        rows = await sql`
          SELECT id, cuenta_id, nombre, descripcion, color, activo, created_at as "createdAt"
          FROM categories
          ORDER BY nombre ASC;
        `;
      }
      return res.status(200).json(rows);
    }

    if (method === 'POST') {
      const { id, cuenta_id, nombre, descripcion, color, activo } = req.body || {};
      if (!cuenta_id || !nombre) {
        return res.status(400).json({ error: 'cuenta_id y nombre son obligatorios.' });
      }

      const catId = id || `cat-${Date.now()}`;
      const isActivo = activo !== undefined ? activo : true;

      const inserted = await sql`
        INSERT INTO categories (id, cuenta_id, nombre, descripcion, color, activo)
        VALUES (${catId}, ${cuenta_id}, ${nombre.trim()}, ${descripcion || ''}, ${color || '#059669'}, ${isActivo})
        RETURNING id, cuenta_id, nombre, descripcion, color, activo, created_at as "createdAt";
      `;
      return res.status(201).json(inserted[0]);
    }

    if (method === 'PUT') {
      const { id, nombre, descripcion, color, activo } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID requerido.' });

      const updated = await sql`
        UPDATE categories
        SET 
          nombre = COALESCE(${nombre ? nombre.trim() : null}, nombre),
          descripcion = COALESCE(${descripcion !== undefined ? descripcion : null}, descripcion),
          color = COALESCE(${color || null}, color),
          activo = COALESCE(${activo !== undefined ? activo : null}, activo),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, cuenta_id, nombre, descripcion, color, activo, created_at as "createdAt";
      `;
      return res.status(200).json(updated[0]);
    }

    if (method === 'DELETE') {
      const { id } = req.query || req.body || {};
      if (!id) return res.status(400).json({ error: 'ID requerido.' });
      await sql`DELETE FROM categories WHERE id = ${id};`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('API Categories Error:', error);
    return res.status(500).json({ error: error.message || 'Error en base de datos.' });
  }
}
