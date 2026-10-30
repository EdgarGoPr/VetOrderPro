import { getSql } from './_db.js';

export default async function handler(req, res) {
  const method = req.method;

  try {
    const sql = getSql();

    // GET /api/accounts
    if (method === 'GET') {
      const rows = await sql`
        SELECT 
          a.id, a.nombre, a.tipo, a.iniciales, a.bajada, a.activo, a.created_at as "createdAt",
          COALESCE(
            (SELECT json_agg(m.user_id) FROM account_members m WHERE m.account_id = a.id),
            '[]'::json
          ) AS miembros
        FROM accounts a
        ORDER BY a.created_at ASC;
      `;
      return res.status(200).json(rows);
    }

    // POST /api/accounts
    if (method === 'POST') {
      const q = req.query || {};
      let b = req.body || {};
      if (typeof b === 'string') {
        try {
          b = JSON.parse(b);
        } catch {
          b = {};
        }
      }
      const action = q.action || b.action;
      const accountId = q.accountId || b.accountId;
      const userId = q.userId || b.userId;
      const remove = q.remove !== undefined 
        ? (q.remove === 'true' || q.remove === true) 
        : Boolean(b.remove);

      // Toggle member: action=member or (accountId && userId && no new account name)
      if (action === 'member' || (accountId && userId && !b.nombre)) {
        if (!accountId || !userId) {
          return res.status(400).json({ error: 'accountId y userId son requeridos.' });
        }

        if (remove) {
          await sql`
            DELETE FROM account_members
            WHERE account_id = ${accountId} AND user_id = ${userId};
          `;
          return res.status(200).json({ success: true, action: 'removed', accountId, userId });
        } else {
          await sql`
            INSERT INTO account_members (account_id, user_id)
            VALUES (${accountId}, ${userId})
            ON CONFLICT (account_id, user_id) DO NOTHING;
          `;
          return res.status(200).json({ success: true, action: 'added', accountId, userId });
        }
      }

      // Create new account
      const { id, nombre, tipo, iniciales, bajada, activo, miembros } = req.body || {};
      if (!nombre || !iniciales) {
        return res.status(400).json({ error: 'Nombre e iniciales son requeridos.' });
      }

      const accId = id || `acc-${Date.now()}`;
      const accTipo = tipo || 'Feedlot';
      const isActivo = activo !== undefined ? activo : true;

      const inserted = await sql`
        INSERT INTO accounts (id, nombre, tipo, iniciales, bajada, activo)
        VALUES (${accId}, ${nombre.trim()}, ${accTipo}, ${iniciales.toUpperCase().trim()}, ${bajada || ''}, ${isActivo})
        RETURNING id, nombre, tipo, iniciales, bajada, activo, created_at as "createdAt";
      `;

      if (miembros && Array.isArray(miembros)) {
        for (const uId of miembros) {
          await sql`
            INSERT INTO account_members (account_id, user_id)
            VALUES (${accId}, ${uId})
            ON CONFLICT (account_id, user_id) DO NOTHING;
          `;
        }
      }

      const accountData = {
        ...inserted[0],
        miembros: miembros || [],
      };

      return res.status(201).json(accountData);
    }

    // PUT /api/accounts
    if (method === 'PUT') {
      const { id, nombre, tipo, iniciales, bajada, activo } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: 'ID de cuenta requerido.' });
      }

      const updated = await sql`
        UPDATE accounts
        SET 
          nombre = COALESCE(${nombre ? nombre.trim() : null}, nombre),
          tipo = COALESCE(${tipo || null}, tipo),
          iniciales = COALESCE(${iniciales ? iniciales.toUpperCase().trim() : null}, iniciales),
          bajada = COALESCE(${bajada !== undefined ? bajada : null}, bajada),
          activo = COALESCE(${activo !== undefined ? activo : null}, activo),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, nombre, tipo, iniciales, bajada, activo, created_at as "createdAt";
      `;

      if (!updated.length) {
        return res.status(404).json({ error: 'Cuenta no encontrada.' });
      }

      return res.status(200).json(updated[0]);
    }

    // DELETE /api/accounts
    if (method === 'DELETE') {
      const { id } = req.query || req.body || {};
      if (!id) {
        return res.status(400).json({ error: 'ID de cuenta requerido.' });
      }

      await sql`DELETE FROM accounts WHERE id = ${id};`;
      return res.status(200).json({ success: true, message: 'Cuenta eliminada.' });
    }

    return res.status(405).json({ error: `Método ${method} no permitido.` });
  } catch (error) {
    console.error('API Accounts Error:', error);
    return res.status(500).json({ error: error.message || 'Error del servidor en base de datos.' });
  }
}
