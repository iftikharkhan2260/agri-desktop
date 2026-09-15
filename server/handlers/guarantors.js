const { requireAuth, httpError } = require('./helpers');

async function list(db, { query, user }) {
  requireAuth(user);
  const search = `%${(query.search || '').trim()}%`;
  return db.all(
    `SELECT * FROM guarantors WHERE deleted = 0 AND (name LIKE ? OR company_name LIKE ? OR contact LIKE ?)
     ORDER BY name COLLATE NOCASE`,
    [search, search, search]
  );
}

async function create(db, { body, user }) {
  requireAuth(user);
  const { name, company_name, contact, address } = body || {};
  if (!name || !name.trim()) throw httpError(400, 'Name is required.');

  const info = await db.run(
    `INSERT INTO guarantors (name, company_name, contact, address, created_by) VALUES (?, ?, ?, ?, ?)`,
    [name.trim(), company_name || '', contact || '', address || '', user.id]
  );
  return db.get('SELECT * FROM guarantors WHERE id = ?', [info.lastInsertRowid]);
}

async function update(db, { params, body, user }) {
  requireAuth(user);
  const { name, company_name, contact, address } = body || {};
  if (!name || !name.trim()) throw httpError(400, 'Name is required.');

  const existing = await db.get('SELECT * FROM guarantors WHERE id = ? AND deleted = 0', [params.id]);
  if (!existing) throw httpError(404, 'Guarantor not found.');

  await db.run(
    `UPDATE guarantors SET name = ?, company_name = ?, contact = ?, address = ?, updated_at = datetime('now') WHERE id = ?`,
    [name.trim(), company_name || '', contact || '', address || '', params.id]
  );
  return db.get('SELECT * FROM guarantors WHERE id = ?', [params.id]);
}

async function remove(db, { params, user }) {
  requireAuth(user);
  const existing = await db.get('SELECT * FROM guarantors WHERE id = ? AND deleted = 0', [params.id]);
  if (!existing) throw httpError(404, 'Guarantor not found.');
  await db.run(`UPDATE guarantors SET deleted = 1, updated_at = datetime('now') WHERE id = ?`, [params.id]);
  return { success: true };
}

module.exports = { list, create, update, remove };
