const { requireAuth, requireRole } = require('./helpers');

async function get(db, { user }) {
  requireAuth(user);
  return db.get('SELECT * FROM shop_settings WHERE id = 1');
}

async function update(db, { body, user }) {
  requireRole(user, 'owner');
  const { shop_name, logo_path, contact, address, branch_name } = body || {};
  const existing = await db.get('SELECT * FROM shop_settings WHERE id = 1');

  await db.run(
    `UPDATE shop_settings SET shop_name = ?, logo_path = ?, contact = ?, address = ?, branch_name = ?, updated_at = datetime('now') WHERE id = 1`,
    [
      shop_name || existing.shop_name,
      logo_path !== undefined ? logo_path : existing.logo_path,
      contact !== undefined ? contact : existing.contact,
      address !== undefined ? address : existing.address,
      branch_name !== undefined ? branch_name : existing.branch_name
    ]
  );
  return db.get('SELECT * FROM shop_settings WHERE id = 1');
}

module.exports = { get, update };
