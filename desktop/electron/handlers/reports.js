const { requireAuth } = require('./helpers');

async function sales(db, { query, user }) {
  requireAuth(user);
  const { order_type, category_id, product, size, from, to } = query;

  let sql = `
    SELECT oi.id, oi.quantity, oi.unit_price, (oi.quantity * oi.unit_price) AS line_total,
           it.name AS item_name, it.category_id, c.name AS category_name, isz.size_label,
           o.order_number, o.is_cash, o.created_at
    FROM order_items oi
    JOIN item_sizes isz ON isz.id = oi.item_size_id
    JOIN items it ON it.id = isz.item_id
    LEFT JOIN categories c ON c.id = it.category_id
    JOIN orders o ON o.id = oi.order_id
    WHERE 1=1
  `;
  const params = [];

  if (order_type === 'cash') sql += ' AND o.is_cash = 1';
  if (order_type === 'loan') sql += ' AND o.is_cash = 0';
  if (category_id) { sql += ' AND it.category_id = ?'; params.push(category_id); }
  if (product) { sql += ' AND it.name LIKE ?'; params.push(`%${product}%`); }
  if (size) { sql += ' AND isz.size_label = ?'; params.push(size); }
  if (from) { sql += ' AND date(o.created_at) >= date(?)'; params.push(from); }
  if (to) { sql += ' AND date(o.created_at) <= date(?)'; params.push(to); }

  sql += ' ORDER BY o.created_at DESC';

  const rows = await db.all(sql, params);
  const totalRevenue = rows.reduce((sum, r) => sum + r.line_total, 0);
  const totalQty = rows.reduce((sum, r) => sum + r.quantity, 0);

  return { rows, summary: { totalRevenue, totalQty, lineCount: rows.length } };
}

module.exports = { sales };
