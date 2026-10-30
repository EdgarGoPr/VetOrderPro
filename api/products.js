import { getSql } from './_db.js';

export default async function handler(req, res) {
  const method = req.method;

  try {
    const sql = getSql();

    if (method === 'GET') {
      const { cuenta_id } = req.query || {};
      let rows;
      if (cuenta_id) {
        rows = await sql`
          SELECT id, cuenta_id, nombre, laboratorio, categoria, presentacion, unidad, minimo, paso, activo, created_at as "createdAt"
          FROM products
          WHERE cuenta_id = ${cuenta_id}
          ORDER BY categoria ASC, nombre ASC;
        `;
      } else {
        rows = await sql`
          SELECT id, cuenta_id, nombre, laboratorio, categoria, presentacion, unidad, minimo, paso, activo, created_at as "createdAt"
          FROM products
          ORDER BY categoria ASC, nombre ASC;
        `;
      }
      return res.status(200).json(rows);
    }

    if (method === 'POST') {
      const { id, cuenta_id, nombre, laboratorio, categoria, presentacion, unidad, minimo, paso, activo } = req.body || {};
      if (!cuenta_id || !nombre) {
        return res.status(400).json({ error: 'cuenta_id y nombre son requeridos.' });
      }

      const prodId = id || `prod-${Date.now()}`;
      const isActivo = activo !== undefined ? activo : true;

      const inserted = await sql`
        INSERT INTO products (id, cuenta_id, nombre, laboratorio, categoria, presentacion, unidad, minimo, paso, activo)
        VALUES (${prodId}, ${cuenta_id}, ${nombre.trim()}, ${laboratorio || ''}, ${categoria || 'Otros'}, ${presentacion || ''}, ${unidad || 'unidad'}, ${minimo || 1}, ${paso || 1}, ${isActivo})
        RETURNING id, cuenta_id, nombre, laboratorio, categoria, presentacion, unidad, minimo, paso, activo, created_at as "createdAt";
      `;
      return res.status(201).json(inserted[0]);
    }

    if (method === 'PUT') {
      const { id, nombre, laboratorio, categoria, presentacion, unidad, minimo, paso, activo } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID requerido.' });

      const updated = await sql`
        UPDATE products
        SET 
          nombre = COALESCE(${nombre ? nombre.trim() : null}, nombre),
          laboratorio = COALESCE(${laboratorio || null}, laboratorio),
          categoria = COALESCE(${categoria || null}, categoria),
          presentacion = COALESCE(${presentacion || null}, presentacion),
          unidad = COALESCE(${unidad || null}, unidad),
          minimo = COALESCE(${minimo || null}, minimo),
          paso = COALESCE(${paso || null}, paso),
          activo = COALESCE(${activo !== undefined ? activo : null}, activo),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, cuenta_id, nombre, laboratorio, categoria, presentacion, unidad, minimo, paso, activo, created_at as "createdAt";
      `;
      return res.status(200).json(updated[0]);
    }

    if (method === 'DELETE') {
      const { id } = req.query || req.body || {};
      if (!id) return res.status(400).json({ error: 'ID requerido.' });
      await sql`DELETE FROM products WHERE id = ${id};`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('API Products Error:', error);
    return res.status(500).json({ error: error.message || 'Error en base de datos.' });
  }
}
