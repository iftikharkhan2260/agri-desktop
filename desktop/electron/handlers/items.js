const { requireAuth, httpError } = require('./helpers');

async function itemWithSizes(db, itemId) {
  const item = await db.get(
    `SELECT i.*, c.name AS category_name FROM items i
     LEFT JOIN categories c ON c.id = i.category_id
     WHERE i.id = ?`,
    [itemId]
  );
  if (!item) return null;
  item.sizes = await db.all(`SELECT * FROM item_sizes WHERE item_id = ? AND deleted = 0 ORDER BY id`, [itemId]);
  return item;
}

async function list(db, { query, user }) {
  requireAuth(user);
  const search = `%${(query.search || '').trim()}%`;
  let sql = `SELECT id FROM items WHERE deleted = 0 AND name LIKE ?`;
  const params = [search];
  if (query.category_id) {
    sql += ' AND category_id = ?';
    params.push(query.category_id);
  }
  const idRows = await db.all(sql, params);
  const items = [];
  for (const row of idRows) {
    const full = await itemWithSizes(db, row.id);
    if (full.sizes.length > 0) items.push(full); // spec 4b: don't show empty-size items
  }
  items.sort((a, b) => b.sizes.length - a.sizes.length); // spec 5b: more sizes first
  return items;
}

async function get(db, { params, user }) {
  requireAuth(user);
  const item = await itemWithSizes(db, params.id);
  if (!item) throw httpError(404, 'Item not found.');
  return item;
}

async function create(db, { body, user }) {
  requireAuth(user);
  const { name, category_id, image_path, sizes } = body || {};
  if (!name || !name.trim()) throw httpError(400, 'Item name is required.');
  if (!Array.isArray(sizes) || sizes.length === 0) throw httpError(400, 'At least one size with a price is required.');

  return db.tx(async () => {
    const info = await db.run('INSERT INTO items (name, category_id, image_path) VALUES (?, ?, ?)', [
      name.trim(), category_id || null, image_path || null
    ]);
    const newItemId = info.lastInsertRowid;

    for (const s of sizes) {
      if (!s.size_label || !s.size_label.trim()) continue;
      const price = Number(s.price) || 0;
      const qty = Number(s.stock_qty) || 0;
      const sizeInfo = await db.run(
        'INSERT INTO item_sizes (item_id, size_label, price, stock_qty) VALUES (?, ?, ?, ?)',
        [newItemId, s.size_label.trim(), price, qty]
      );
      if (qty > 0) {
        await db.run(
          `INSERT INTO stock_history (item_id, item_size_id, item_name, size_label, qty_added, price_at_time, added_by, added_by_name)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [newItemId, sizeInfo.lastInsertRowid, name.trim(), s.size_label.trim(), qty, price, user.id, user.name]
        );
      }
    }
    return itemWithSizes(db, newItemId);
  });
}

async function update(db, { params, body, user }) {
  requireAuth(user);
  const { name, category_id, image_path, sizes } = body || {};
  const existing = await db.get('SELECT * FROM items WHERE id = ? AND deleted = 0', [params.id]);
  if (!existing) throw httpError(404, 'Item not found.');
  if (!name || !name.trim()) throw httpError(400, 'Item name is required.');

  return db.tx(async () => {
    await db.run('UPDATE items SET name = ?, category_id = ?, image_path = ? WHERE id = ?', [
      name.trim(), category_id || null, image_path !== undefined ? image_path : existing.image_path, params.id
    ]);

    for (const s of sizes || []) {
      if (!s.size_label || !s.size_label.trim()) continue;
      const price = Number(s.price) || 0;
      const addQty = Number(s.add_stock) || 0;

      if (s.id) {
        await db.run('UPDATE item_sizes SET price = ?, stock_qty = stock_qty + ? WHERE id = ? AND item_id = ?', [
          price, addQty, s.id, params.id
        ]);
        if (addQty > 0) {
          await db.run(
            `INSERT INTO stock_history (item_id, item_size_id, item_name, size_label, qty_added, price_at_time, added_by, added_by_name)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [params.id, s.id, name.trim(), s.size_label.trim(), addQty, price, user.id, user.name]
          );
        }
      } else {
        const initialQty = Number(s.stock_qty || s.add_stock) || 0;
        const sizeInfo = await db.run(
          'INSERT INTO item_sizes (item_id, size_label, price, stock_qty) VALUES (?, ?, ?, ?)',
          [params.id, s.size_label.trim(), price, initialQty]
        );
        if (initialQty > 0) {
          await db.run(
            `INSERT INTO stock_history (item_id, item_size_id, item_name, size_label, qty_added, price_at_time, added_by, added_by_name)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [params.id, sizeInfo.lastInsertRowid, name.trim(), s.size_label.trim(), initialQty, price, user.id, user.name]
          );
        }
      }
    }
    return itemWithSizes(db, params.id);
  });
}

async function remove(db, { params, user }) {
  requireAuth(user);
  const existing = await db.get('SELECT * FROM items WHERE id = ? AND deleted = 0', [params.id]);
  if (!existing) throw httpError(404, 'Item not found.');
  await db.run('UPDATE items SET deleted = 1 WHERE id = ?', [params.id]);
  return { success: true };
}

async function removeSize(db, { params, user }) {
  requireAuth(user);
  const size = await db.get('SELECT * FROM item_sizes WHERE id = ? AND item_id = ? AND deleted = 0', [params.sizeId, params.itemId]);
  if (!size) throw httpError(404, 'Size not found.');
  await db.run('UPDATE item_sizes SET deleted = 1 WHERE id = ?', [params.sizeId]);
  return { success: true };
}

// Section 2: stock history — what/how much/when/by whom, filterable by date range and item.
async function stockHistory(db, { query, user }) {
  requireAuth(user);
  let sql = `SELECT * FROM stock_history WHERE 1=1`;
  const params = [];
  if (query.item_id) { sql += ' AND item_id = ?'; params.push(query.item_id); }
  if (query.search) { sql += ' AND (item_name LIKE ? OR added_by_name LIKE ?)'; params.push(`%${query.search}%`, `%${query.search}%`); }
  if (query.from) { sql += ' AND date(created_at) >= date(?)'; params.push(query.from); }
  if (query.to) { sql += ' AND date(created_at) <= date(?)'; params.push(query.to); }
  sql += ' ORDER BY created_at DESC';
  return db.all(sql, params);
}

module.exports = { list, get, create, update, remove, removeSize, stockHistory };
