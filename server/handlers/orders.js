const { requireAuth, httpError } = require('./helpers');

async function nextOrderNumber(db, userId) {
  const row = await db.get(`SELECT COUNT(*) AS n FROM orders WHERE salesman_id = ?`, [userId]);
  return `${userId}-${String(row.n + 1).padStart(4, '0')}`;
}

async function fullOrder(db, orderId) {
  const order = await db.get(
    `SELECT o.*, u.name AS salesman_name, k.full_name AS kisan_name, k.mark_name AS kisan_mark_name,
            z.name AS zamindar_name, g.name AS guarantor_name
     FROM orders o
     LEFT JOIN users u ON u.id = o.salesman_id
     LEFT JOIN kisans k ON k.id = o.kisan_id
     LEFT JOIN zamindars z ON z.id = o.zamindar_id
     LEFT JOIN guarantors g ON g.id = o.guarantor_id
     WHERE o.id = ?`,
    [orderId]
  );
  if (!order) return null;

  order.items = await db.all(
    `SELECT oi.*, isz.size_label, it.name AS item_name, it.category_id
     FROM order_items oi
     JOIN item_sizes isz ON isz.id = oi.item_size_id
     JOIN items it ON it.id = isz.item_id
     WHERE oi.order_id = ?`,
    [orderId]
  );

  order.effectively_settled = order.is_cash === 1 ? 1 : order.settled;
  return order;
}

async function list(db, { query, user }) {
  requireAuth(user);
  const { search, is_cash, kisan_id, zamindar_id, guarantor_id, settled, from, to } = query;

  let sql = `SELECT DISTINCT o.id FROM orders o
             LEFT JOIN order_items oi ON oi.order_id = o.id
             LEFT JOIN item_sizes isz ON isz.id = oi.item_size_id
             LEFT JOIN items it ON it.id = isz.item_id
             LEFT JOIN kisans k ON k.id = o.kisan_id
             WHERE 1=1`;
  const params = [];

  if (search) {
    sql += ` AND (o.order_number LIKE ? OR o.receiver_name LIKE ? OR k.full_name LIKE ? OR it.name LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (is_cash === 'cash') sql += ' AND o.is_cash = 1';
  if (is_cash === 'loan') sql += ' AND o.is_cash = 0';
  if (kisan_id) { sql += ' AND o.kisan_id = ?'; params.push(kisan_id); }
  if (zamindar_id) { sql += ' AND o.zamindar_id = ?'; params.push(zamindar_id); }
  if (guarantor_id) { sql += ' AND o.guarantor_id = ?'; params.push(guarantor_id); }
  if (query.category_id) { sql += ' AND it.category_id = ?'; params.push(query.category_id); }
  if (query.product) { sql += ' AND it.name LIKE ?'; params.push(`%${query.product}%`); }
  if (settled === 'settled') sql += ' AND (o.is_cash = 1 OR o.settled = 1)';
  if (settled === 'unsettled') sql += ' AND o.is_cash = 0 AND o.settled = 0';
  if (from) { sql += ' AND date(o.created_at) >= date(?)'; params.push(from); }
  if (to) { sql += ' AND date(o.created_at) <= date(?)'; params.push(to); }

  sql += ' ORDER BY o.created_at DESC';

  const idRows = await db.all(sql, params);
  const orders = [];
  for (const row of idRows) orders.push(await fullOrder(db, row.id));
  return orders;
}

async function get(db, { params, user }) {
  requireAuth(user);
  const order = await fullOrder(db, params.id);
  if (!order) throw httpError(404, 'Order not found.');
  return order;
}

async function create(db, { body, user }) {
  requireAuth(user);
  const { is_cash, receiver_name, kisan_id, zamindar_id, guarantor_id, items } = body || {};

  if (!Array.isArray(items) || items.length === 0) throw httpError(400, 'Order must have at least one item.');
  if (!is_cash && !kisan_id) throw httpError(400, 'Kisan name is required for non-cash (loan) orders.');

  const total = items.reduce((sum, i) => sum + Number(i.unit_price) * Number(i.quantity), 0);

  return db.tx(async () => {
    const orderNumber = await nextOrderNumber(db, user.id);
    const info = await db.run(
      `INSERT INTO orders (order_number, salesman_id, is_cash, receiver_name, kisan_id, zamindar_id, guarantor_id, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderNumber, user.id, is_cash ? 1 : 0, receiver_name || '', kisan_id || null, zamindar_id || null, guarantor_id || null, total]
    );
    const newOrderId = info.lastInsertRowid;

    for (const it of items) {
      await db.run('INSERT INTO order_items (order_id, item_size_id, quantity, unit_price) VALUES (?, ?, ?, ?)', [
        newOrderId, it.item_size_id, it.quantity, it.unit_price
      ]);
      await db.run('UPDATE item_sizes SET stock_qty = stock_qty - ? WHERE id = ?', [it.quantity, it.item_size_id]);
    }

    // Cash orders are settled by definition and are recorded as a payment
    // straight away, so cash still flows through Payments -> Collection
    // (sections 7b, 8) just like loan settlements do.
    if (is_cash) {
      const countRow = await db.get('SELECT COUNT(*) AS n FROM payments WHERE received_by = ?', [user.id]);
      const paymentNo = `PA-${user.id}-${String(countRow.n + 1).padStart(4, '0')}`;
      const payInfo = await db.run(
        `INSERT INTO payments (payment_no, received_from, received_by, kisan_id, guarantor_id, total_amount, is_cash)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [paymentNo, receiver_name || 'Cash Customer', user.id, kisan_id || null, guarantor_id || null, total]
      );
      await db.run('INSERT INTO payment_orders (payment_id, order_id, amount) VALUES (?, ?, ?)', [
        payInfo.lastInsertRowid, newOrderId, total
      ]);
    }

    return fullOrder(db, newOrderId);
  });
}

const EDIT_WINDOW_MINUTES = 10; // section 4

function minutesSince(isoTimestamp) {
  // SQLite datetime('now') stores UTC without a 'Z' suffix — add it so
  // Date parses it as UTC instead of assuming local time.
  const iso = isoTimestamp.includes('Z') ? isoTimestamp : isoTimestamp.replace(' ', 'T') + 'Z';
  return (Date.now() - new Date(iso).getTime()) / 60000;
}

// Section 4: an order can be edited (items/quantities, receiver, kisan,
// zamindar, guarantor) within 10 minutes of creation, as long as it hasn't
// already been settled. The cash/loan flag itself is not editable — that
// keeps the auto-created cash payment record unambiguous.
async function update(db, { params, body, user }) {
  requireAuth(user);
  const existing = await db.get('SELECT * FROM orders WHERE id = ?', [params.id]);
  if (!existing) throw httpError(404, 'Order not found.');
  if (existing.settled) throw httpError(400, 'This order is already settled and can no longer be edited.');
  if (minutesSince(existing.created_at) > EDIT_WINDOW_MINUTES) {
    throw httpError(400, `Orders can only be edited within ${EDIT_WINDOW_MINUTES} minutes of creation.`);
  }

  const { receiver_name, kisan_id, zamindar_id, guarantor_id, items } = body || {};
  if (!Array.isArray(items) || items.length === 0) throw httpError(400, 'Order must have at least one item.');
  if (!existing.is_cash && !kisan_id) throw httpError(400, 'Kisan name is required for non-cash (loan) orders.');

  const newTotal = items.reduce((sum, i) => sum + Number(i.unit_price) * Number(i.quantity), 0);

  return db.tx(async () => {
    // Reverse the stock effect of the order's current items before applying the new list.
    const oldItems = await db.all('SELECT * FROM order_items WHERE order_id = ?', [params.id]);
    for (const oi of oldItems) {
      await db.run('UPDATE item_sizes SET stock_qty = stock_qty + ? WHERE id = ?', [oi.quantity, oi.item_size_id]);
    }
    await db.run('DELETE FROM order_items WHERE order_id = ?', [params.id]);

    for (const it of items) {
      await db.run('INSERT INTO order_items (order_id, item_size_id, quantity, unit_price) VALUES (?, ?, ?, ?)', [
        params.id, it.item_size_id, it.quantity, it.unit_price
      ]);
      await db.run('UPDATE item_sizes SET stock_qty = stock_qty - ? WHERE id = ?', [it.quantity, it.item_size_id]);
    }

    await db.run(
      `UPDATE orders SET receiver_name = ?, kisan_id = ?, zamindar_id = ?, guarantor_id = ?, total_amount = ? WHERE id = ?`,
      [receiver_name || '', kisan_id || null, zamindar_id || null, guarantor_id || null, newTotal, params.id]
    );

    // Keep the auto-created cash payment in sync with the edited total.
    if (existing.is_cash) {
      const paymentOrder = await db.get('SELECT * FROM payment_orders WHERE order_id = ?', [params.id]);
      if (paymentOrder) {
        await db.run('UPDATE payment_orders SET amount = ? WHERE id = ?', [newTotal, paymentOrder.id]);
        await db.run('UPDATE payments SET total_amount = ?, received_from = ?, kisan_id = ?, guarantor_id = ? WHERE id = ?', [
          newTotal, receiver_name || 'Cash Customer', kisan_id || null, guarantor_id || null, paymentOrder.payment_id
        ]);
      }
    }

    return fullOrder(db, params.id);
  });
}

module.exports = { list, get, create, update };
