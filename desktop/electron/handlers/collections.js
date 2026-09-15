const { requireRole, httpError } = require('./helpers');

async function fullCollection(db, collectionId) {
  const collection = await db.get(
    `SELECT c.*, ub.name AS collected_by_name FROM collections c
     LEFT JOIN users ub ON ub.id = c.collected_by
     WHERE c.id = ?`,
    [collectionId]
  );
  if (!collection) return null;

  collection.payments = await db.all(
    `SELECT cp.payment_id, cp.amount, p.payment_no, p.received_from, p.received_by AS received_by_id, u.name AS received_by_name
     FROM collection_payments cp
     JOIN payments p ON p.id = cp.payment_id
     LEFT JOIN users u ON u.id = p.received_by
     WHERE cp.collection_id = ?`,
    [collectionId]
  );

  // Section 5: every payment in a collection was received by the same
  // employee (enforced on create), so that employee is "who this was
  // collected from" — surfaced once at the top level for cards/receipts.
  collection.collected_from_name = collection.payments[0]?.received_by_name || null;
  return collection;
}

// Section 16: Collection screen is owner-only.
async function list(db, { query, user }) {
  requireRole(user, 'owner');
  let sql = `SELECT id FROM collections WHERE collection_id LIKE ?`;
  const params = [`%${query.search || ''}%`];
  if (query.date) { sql += ` AND date(created_at) = date(?)`; params.push(query.date); }
  sql += ' ORDER BY created_at DESC';

  const idRows = await db.all(sql, params);
  const out = [];
  for (const row of idRows) out.push(await fullCollection(db, row.id));
  return out;
}

async function pendingPayments(db, { user }) {
  requireRole(user, 'owner');
  return db.all(
    `SELECT p.*, u.name AS received_by_name FROM payments p
     LEFT JOIN users u ON u.id = p.received_by
     WHERE p.collected = 0 ORDER BY p.created_at DESC`
  );
}

// Section 4: any non-collected payment is selectable, cash or not — the
// only rule is that all selected payments share the same received_by.
async function create(db, { body, user }) {
  requireRole(user, 'owner');
  const { payment_ids } = body || {};
  if (!Array.isArray(payment_ids) || payment_ids.length === 0) throw httpError(400, 'Select at least one payment.');

  return db.tx(async () => {
    const payments = [];
    for (const id of payment_ids) {
      const p = await db.get('SELECT * FROM payments WHERE id = ?', [id]);
      if (!p) throw httpError(404, 'One or more payments were not found.');
      payments.push(p);
    }
    if (payments.some((p) => p.collected === 1)) throw httpError(400, 'One or more selected payments are already collected.');

    const receivers = new Set(payments.map((p) => p.received_by));
    if (receivers.size > 1) throw httpError(400, 'All selected payments must have been received by the same person.');

    const total = payments.reduce((sum, p) => sum + p.total_amount, 0);
    const countRow = await db.get('SELECT COUNT(*) AS n FROM collections WHERE collected_by = ?', [user.id]);
    const collectionId = `Coll-${user.id}-${String(countRow.n + 1).padStart(4, '0')}`;

    const info = await db.run('INSERT INTO collections (collection_id, collected_by, total_amount) VALUES (?, ?, ?)', [
      collectionId, user.id, total
    ]);
    for (const p of payments) {
      await db.run('INSERT INTO collection_payments (collection_id, payment_id, amount) VALUES (?, ?, ?)', [info.lastInsertRowid, p.id, p.total_amount]);
      await db.run('UPDATE payments SET collected = 1 WHERE id = ?', [p.id]);
    }
    return fullCollection(db, info.lastInsertRowid);
  });
}

module.exports = { list, create, pendingPayments };
