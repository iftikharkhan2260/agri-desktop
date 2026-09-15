const { requireAuth, httpError } = require('./helpers');

async function list(db, { query, user }) {
  requireAuth(user);
  const search = `%${(query.search || '').trim()}%`;
  return db.all(`SELECT * FROM categories WHERE deleted = 0 AND name LIKE ? ORDER BY name COLLATE NOCASE`, [search]);
}

async function create(db, { body, user }) {
  requireAuth(user);
  const { name } = body || {};
  if (!name || !name.trim()) throw httpError(400, 'Category name is required.');

  const existing = await db.get('SELECT * FROM categories WHERE name = ? AND deleted = 0', [name.trim()]);
  if (existing) return existing;

  const info = await db.run('INSERT INTO categories (name) VALUES (?)', [name.trim()]);
  return db.get('SELECT * FROM categories WHERE id = ?', [info.lastInsertRowid]);
}

module.exports = { list, create };
