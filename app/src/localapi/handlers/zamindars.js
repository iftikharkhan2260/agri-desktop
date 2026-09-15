const { requireAuth, httpError } = require('./helpers');

async function list(db, { query, user }) {
  requireAuth(user);
  const search = `%${(query.search || '').trim()}%`;
  return db.all(
    `SELECT * FROM zamindars WHERE deleted = 0 AND (name LIKE ? OR contact LIKE ?) ORDER BY name COLLATE NOCASE`,
    [search, search]
  );
}

async function create(db, { body, user }) {
  requireAuth(user);
  const { name, contact, address } = body || {};
  if (!name || !name.trim()) throw httpError(400, 'Name is required.');

  const info = await db.run(
    `INSERT INTO zamindars (name, contact, address, created_by) VALUES (?, ?, ?, ?)`,
    [name.trim(), contact || '', address || '', user.id]
  );
  return db.get('SELECT * FROM zamindars WHERE id = ?', [info.lastInsertRowid]);
}

async function update(db, { params, body, user }) {
  requireAuth(user);
  const { name, contact, address } = body || {};
  if (!name || !name.trim()) throw httpError(400, 'Name is required.');

  const existing = await db.get('SELECT * FROM zamindars WHERE id = ? AND deleted = 0', [params.id]);
  if (!existing) throw httpError(404, 'Zamindar not found.');

  await db.run(
    `UPDATE zamindars SET name = ?, contact = ?, address = ?, updated_at = datetime('now') WHERE id = ?`,
    [name.trim(), contact || '', address || '', params.id]
  );
  return db.get('SELECT * FROM zamindars WHERE id = ?', [params.id]);
}

async function remove(db, { params, user }) {
  requireAuth(user);
  const existing = await db.get('SELECT * FROM zamindars WHERE id = ? AND deleted = 0', [params.id]);
  if (!existing) throw httpError(404, 'Zamindar not found.');
  await db.run(`UPDATE zamindars SET deleted = 1, updated_at = datetime('now') WHERE id = ?`, [params.id]);
  return { success: true };
}

module.exports = { list, create, update, remove };
