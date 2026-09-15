const { requireAuth, httpError } = require('./helpers');

const SELECT_JOIN = `
  SELECT k.*, z.name AS zamindar_name, g.name AS guarantor_name
  FROM kisans k
  LEFT JOIN zamindars z ON z.id = k.zamindar_id
  LEFT JOIN guarantors g ON g.id = k.guarantor_id
`;

async function list(db, { query, user }) {
  requireAuth(user);
  const search = `%${(query.search || '').trim()}%`;
  let sql = `${SELECT_JOIN} WHERE k.deleted = 0 AND (k.mark_name LIKE ? OR k.full_name LIKE ? OR k.phone LIKE ?)`;
  const params = [search, search, search];

  if (query.zamindar_id) {
    sql += ' AND k.zamindar_id = ?';
    params.push(query.zamindar_id);
  }
  sql += ' ORDER BY k.full_name COLLATE NOCASE';
  return db.all(sql, params);
}

async function create(db, { body, user }) {
  requireAuth(user);
  const { mark_name, full_name, phone, address, zamindar_id, guarantor_id } = body || {};
  if (!mark_name || !mark_name.trim()) throw httpError(400, 'Mark name is required.');
  if (!full_name || !full_name.trim()) throw httpError(400, 'Full name is required.');

  const dup = await db.get('SELECT id FROM kisans WHERE mark_name = ? AND deleted = 0', [mark_name.trim()]);
  if (dup) throw httpError(409, 'Mark name must be unique — this one is already used.');

  const info = await db.run(
    `INSERT INTO kisans (mark_name, full_name, phone, address, zamindar_id, guarantor_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mark_name.trim(), full_name.trim(), phone || '', address || '', zamindar_id || null, guarantor_id || null, user.id]
  );
  return db.get(`${SELECT_JOIN} WHERE k.id = ?`, [info.lastInsertRowid]);
}

async function update(db, { params, body, user }) {
  requireAuth(user);
  const { mark_name, full_name, phone, address, zamindar_id, guarantor_id } = body || {};
  if (!mark_name || !mark_name.trim()) throw httpError(400, 'Mark name is required.');
  if (!full_name || !full_name.trim()) throw httpError(400, 'Full name is required.');

  const existing = await db.get('SELECT * FROM kisans WHERE id = ? AND deleted = 0', [params.id]);
  if (!existing) throw httpError(404, 'Kisan not found.');

  const dup = await db.get('SELECT id FROM kisans WHERE mark_name = ? AND deleted = 0 AND id != ?', [mark_name.trim(), params.id]);
  if (dup) throw httpError(409, 'Mark name must be unique — this one is already used.');

  await db.run(
    `UPDATE kisans SET mark_name = ?, full_name = ?, phone = ?, address = ?, zamindar_id = ?, guarantor_id = ?,
     updated_at = datetime('now') WHERE id = ?`,
    [mark_name.trim(), full_name.trim(), phone || '', address || '', zamindar_id || null, guarantor_id || null, params.id]
  );
  return db.get(`${SELECT_JOIN} WHERE k.id = ?`, [params.id]);
}

async function remove(db, { params, user }) {
  requireAuth(user);
  const existing = await db.get('SELECT * FROM kisans WHERE id = ? AND deleted = 0', [params.id]);
  if (!existing) throw httpError(404, 'Kisan not found.');
  await db.run(`UPDATE kisans SET deleted = 1, updated_at = datetime('now') WHERE id = ?`, [params.id]);
  return { success: true };
}

module.exports = { list, create, update, remove };
