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
          SELECT id, cuenta_id, nombre, contacto, telefono, email, direccion, notas, activo, created_at as "createdAt"
          FROM suppliers
          WHERE cuenta_id = ${cuenta_id}
          ORDER BY nombre ASC;
        `;
      } else {
        rows = await sql`
          SELECT id, cuenta_id, nombre, contacto, telefono, email, direccion, notas, activo, created_at as "createdAt"
          FROM suppliers
          ORDER BY nombre ASC;
        `;
      }
      return res.status(200).json(rows);
    }

    if (method === 'POST') {
      const { id, cuenta_id, nombre, contacto, telefono, email, direccion, notas, activo } = req.body || {};
      if (!cuenta_id || !nombre) {
        return res.status(400).json({ error: 'cuenta_id y nombre son obligatorios.' });
      }

      const supId = id || `sup-${Date.now()}`;
      const isActivo = activo !== undefined ? activo : true;

      const inserted = await sql`
        INSERT INTO suppliers (id, cuenta_id, nombre, contacto, telefono, email, direccion, notas, activo)
        VALUES (${supId}, ${cuenta_id}, ${nombre.trim()}, ${contacto || ''}, ${telefono || ''}, ${email || ''}, ${direccion || ''}, ${notas || ''}, ${isActivo})
        RETURNING id, cuenta_id, nombre, contacto, telefono, email, direccion, notas, activo, created_at as "createdAt";
      `;
      return res.status(201).json(inserted[0]);
    }

    if (method === 'PUT') {
      const { id, nombre, contacto, telefono, email, direccion, notas, activo } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID de proveedor requerido.' });

      const updated = await sql`
        UPDATE suppliers
        SET 
          nombre = COALESCE(${nombre ? nombre.trim() : null}, nombre),
          contacto = COALESCE(${contacto !== undefined ? contacto : null}, contacto),
          telefono = COALESCE(${telefono !== undefined ? telefono : null}, telefono),
          email = COALESCE(${email !== undefined ? email : null}, email),
          direccion = COALESCE(${direccion !== undefined ? direccion : null}, direccion),
          notas = COALESCE(${notas !== undefined ? notas : null}, notas),
          activo = COALESCE(${activo !== undefined ? activo : null}, activo),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, cuenta_id, nombre, contacto, telefono, email, direccion, notas, activo, created_at as "createdAt";
      `;

      return res.status(200).json(updated[0]);
    }

    if (method === 'DELETE') {
      const { id } = req.query || req.body || {};
      if (!id) return res.status(400).json({ error: 'ID requerido.' });
      await sql`DELETE FROM suppliers WHERE id = ${id};`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('API Suppliers Error:', error);
    return res.status(500).json({ error: error.message || 'Error en base de datos.' });
  }
}
