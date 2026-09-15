const { requireRole, httpError } = require('./helpers');

async function fullPayment(db, paymentId) {
  const payment = await db.get(
    `SELECT p.*, ub.name AS received_by_name, k.full_name AS kisan_name, g.name AS guarantor_name
     FROM payments p
     LEFT JOIN users ub ON ub.id = p.received_by
     LEFT JOIN kisans k ON k.id = p.kisan_id
     LEFT JOIN guarantors g ON g.id = p.guarantor_id
     WHERE p.id = ?`,
    [paymentId]
  );
  if (!payment) return null;

  payment.orders = await db.all(
    `SELECT po.order_id, po.amount, o.order_number FROM payment_orders po
     JOIN orders o ON o.id = po.order_id WHERE po.payment_id = ?`,
    [paymentId]
  );
  return payment;
}

// Section 16: Settlement/Payments screen is owner-only.
async function list(db, { query, user }) {
  requireRole(user, 'owner');
  let sql = `SELECT p.id FROM payments p
             LEFT JOIN kisans k ON k.id = p.kisan_id
             LEFT JOIN guarantors g ON g.id = p.guarantor_id
             WHERE (p.payment_no LIKE ? OR p.received_from LIKE ? OR k.full_name LIKE ? OR g.name LIKE ?)`;
  const s = `%${query.search || ''}%`;
  const params = [s, s, s, s];

  if (query.collected === 'yes') sql += ' AND p.collected = 1';
  if (query.collected === 'no') sql += ' AND p.collected = 0';
  if (query.is_cash === 'cash') sql += ' AND p.is_cash = 1';
  if (query.is_cash === 'loan') sql += ' AND p.is_cash = 0';
  sql += ' ORDER BY p.created_at DESC';

  const idRows = await db.all(sql, params);
  const out = [];
  for (const row of idRows) out.push(await fullPayment(db, row.id));
  return out;
}

// Settlement submission for selected LOAN orders. All selected orders must
// share the same kisan and same guarantor.
async function create(db, { body, user }) {
  requireRole(user, 'owner');
  const { order_ids, received_from } = body || {};
  if (!Array.isArray(order_ids) || order_ids.length === 0) throw httpError(400, 'Select at least one order.');
  if (!received_from || !received_from.trim()) throw httpError(400, '"Received from" is required.');

  return db.tx(async () => {
    const orders = [];
    for (const id of order_ids) {
      const o = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
      if (!o) throw httpError(404, 'One or more orders were not found.');
      orders.push(o);
    }
    if (orders.some((o) => o.is_cash === 1)) throw httpError(400, 'Cash orders cannot be selected for settlement.');
    if (orders.some((o) => o.settled === 1)) throw httpError(400, 'One or more selected orders are already settled.');

    const kisanIds = new Set(orders.map((o) => o.kisan_id));
    const guarantorIds = new Set(orders.map((o) => o.guarantor_id));
    if (kisanIds.size > 1 || guarantorIds.size > 1) {
      throw httpError(400, 'All selected orders must have the same Kisan and same Guarantor.');
    }

    const total = orders.reduce((sum, o) => sum + o.total_amount, 0);
    const countRow = await db.get('SELECT COUNT(*) AS n FROM payments WHERE received_by = ?', [user.id]);
    const paymentNo = `PA-${user.id}-${String(countRow.n + 1).padStart(4, '0')}`;

    const info = await db.run(
      `INSERT INTO payments (payment_no, received_from, received_by, kisan_id, guarantor_id, total_amount)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [paymentNo, received_from.trim(), user.id, [...kisanIds][0] || null, [...guarantorIds][0] || null, total]
    );
    for (const o of orders) {
      await db.run('INSERT INTO payment_orders (payment_id, order_id, amount) VALUES (?, ?, ?)', [info.lastInsertRowid, o.id, o.total_amount]);
      await db.run('UPDATE orders SET settled = 1 WHERE id = ?', [o.id]);
    }
    return fullPayment(db, info.lastInsertRowid);
  });
}

module.exports = { list, create };
