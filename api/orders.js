import { getSql } from './_db.js';

export default async function handler(req, res) {
  const method = req.method;

  try {
    const sql = getSql();

    if (method === 'GET') {
      const { cuenta_id, id } = req.query || {};

      if (id) {
        const orderRes = await sql`
          SELECT 
            o.id, o.numero, o.cuenta_id, o.laboratorio, o.fecha::text as fecha, o.estado, o.observaciones, o.created_at as "createdAt",
            COALESCE(
              (
                SELECT json_agg(
                  json_build_object(
                    'producto_id', i.producto_id,
                    'nombre', i.nombre,
                    'presentacion', i.presentacion,
                    'unidad', i.unidad,
                    'cantidad', i.cantidad::float,
                    'minimo', i.minimo,
                    'paso', i.paso,
                    'laboratorio', i.laboratorio
                  ) ORDER BY i.orden
                )
                FROM order_items i 
                WHERE i.order_id = o.id
              ),
              '[]'::json
            ) AS items
          FROM orders o
          WHERE o.id = ${id};
        `;
        if (!orderRes.length) return res.status(404).json({ error: 'Orden no encontrada.' });
        return res.status(200).json(orderRes[0]);
      }

      let rows;
      if (cuenta_id) {
        rows = await sql`
          SELECT 
            o.id, o.numero, o.cuenta_id, o.laboratorio, o.fecha::text as fecha, o.estado, o.observaciones, o.created_at as "createdAt",
            COALESCE(
              (
                SELECT json_agg(
                  json_build_object(
                    'producto_id', i.producto_id,
                    'nombre', i.nombre,
                    'presentacion', i.presentacion,
                    'unidad', i.unidad,
                    'cantidad', i.cantidad::float,
                    'minimo', i.minimo,
                    'paso', i.paso,
                    'laboratorio', i.laboratorio
                  ) ORDER BY i.orden
                )
                FROM order_items i 
                WHERE i.order_id = o.id
              ),
              '[]'::json
            ) AS items
          FROM orders o
          WHERE o.cuenta_id = ${cuenta_id}
          ORDER BY o.fecha DESC, o.created_at DESC;
        `;
      } else {
        rows = await sql`
          SELECT 
            o.id, o.numero, o.cuenta_id, o.laboratorio, o.fecha::text as fecha, o.estado, o.observaciones, o.created_at as "createdAt",
            COALESCE(
              (
                SELECT json_agg(
                  json_build_object(
                    'producto_id', i.producto_id,
                    'nombre', i.nombre,
                    'presentacion', i.presentacion,
                    'unidad', i.unidad,
                    'cantidad', i.cantidad::float,
                    'minimo', i.minimo,
                    'paso', i.paso,
                    'laboratorio', i.laboratorio
                  ) ORDER BY i.orden
                )
                FROM order_items i 
                WHERE i.order_id = o.id
              ),
              '[]'::json
            ) AS items
          FROM orders o
          ORDER BY o.fecha DESC, o.created_at DESC;
        `;
      }

      return res.status(200).json(rows);
    }

    if (method === 'POST') {
      const { id, numero, cuenta_id, laboratorio, fecha, estado, observaciones, items } = req.body || {};
      if (!cuenta_id || !numero || !fecha) {
        return res.status(400).json({ error: 'cuenta_id, numero y fecha son obligatorios.' });
      }

      const ordId = id || `ord-${Date.now()}`;
      const ordEstado = estado || 'Emitida';
      const ordLab = laboratorio || '';

      const inserted = await sql`
        INSERT INTO orders (id, numero, cuenta_id, laboratorio, fecha, estado, observaciones)
        VALUES (${ordId}, ${numero}, ${cuenta_id}, ${ordLab}, ${fecha}, ${ordEstado}, ${observaciones || ''})
        RETURNING id, numero, cuenta_id, laboratorio, fecha::text as fecha, estado, observaciones, created_at as "createdAt";
      `;

      if (items && Array.isArray(items)) {
        for (let idx = 0; idx < items.length; idx++) {
          const item = items[idx];
          const itemId = `itm-${ordId}-${idx + 1}`;
          await sql`
            INSERT INTO order_items (id, order_id, producto_id, nombre, presentacion, unidad, cantidad, minimo, paso, laboratorio, orden)
            VALUES (
              ${itemId},
              ${ordId},
              ${item.producto_id || null},
              ${item.nombre},
              ${item.presentacion || ''},
              ${item.unidad || 'unidad'},
              ${Number(item.cantidad) || 1},
              ${item.minimo || 1},
              ${item.paso || 1},
              ${item.laboratorio || ordLab},
              ${idx + 1}
            );
          `;
        }
      }

      return res.status(201).json({
        ...inserted[0],
        items: items || [],
      });
    }

    if (method === 'PUT') {
      const { id, estado, observaciones, laboratorio, fecha } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID requerido.' });

      const updated = await sql`
        UPDATE orders
        SET 
          estado = COALESCE(${estado || null}, estado),
          observaciones = COALESCE(${observaciones !== undefined ? observaciones : null}, observaciones),
          laboratorio = COALESCE(${laboratorio !== undefined ? laboratorio : null}, laboratorio),
          fecha = COALESCE(${fecha ? fecha : null}, fecha),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, numero, cuenta_id, laboratorio, fecha::text as fecha, estado, observaciones, created_at as "createdAt";
      `;

      return res.status(200).json(updated[0]);
    }

    if (method === 'DELETE') {
      const { id } = req.query || req.body || {};
      if (!id) return res.status(400).json({ error: 'ID requerido.' });
      await sql`DELETE FROM orders WHERE id = ${id};`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('API Orders Error:', error);
    return res.status(500).json({ error: error.message || 'Error en base de datos.' });
  }
}
