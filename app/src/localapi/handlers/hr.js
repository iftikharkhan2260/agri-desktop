const passwordHash = require('../passwordHash');
const { requireRole, requireAuth, httpError } = require('./helpers');

const ALLOWED_ROLES = ['owner', 'manager', 'salesman', 'support_staff'];

async function listEmployees(db, { user }) {
  requireRole(user, 'owner');
  return db.all(
    `SELECT id, name, username, role, contact, education, address, salary, active, created_at
     FROM users WHERE active = 1 ORDER BY name COLLATE NOCASE`
  );
}

async function me(db, { user }) {
  requireAuth(user);
  return db.get(
    `SELECT id, name, username, role, contact, education, address, salary, created_at FROM users WHERE id = ?`,
    [user.id]
  );
}

async function createEmployee(db, { body, user }) {
  requireRole(user, 'owner');
  const { name, username, password, role, contact, education, address, salary } = body || {};
  if (!name || !username || !password || !ALLOWED_ROLES.includes(role)) {
    throw httpError(400, 'Name, username, password, and a valid role are required.');
  }
  const existing = await db.get('SELECT id FROM users WHERE username = ?', [username]);
  if (existing) throw httpError(409, 'That username is already taken.');

  const hash = passwordHash.hashSync(password);
  const info = await db.run(
    `INSERT INTO users (name, username, password_hash, role, contact, education, address, salary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, username, hash, role, contact || '', education || '', address || '', Number(salary) || 0]
  );
  return { id: info.lastInsertRowid };
}

async function updateEmployee(db, { params, body, user }) {
  requireRole(user, 'owner');
  const { name, role, contact, education, address, salary, password } = body || {};
  const existing = await db.get('SELECT * FROM users WHERE id = ? AND active = 1', [params.id]);
  if (!existing) throw httpError(404, 'Employee not found.');

  await db.run(
    `UPDATE users SET name = ?, role = ?, contact = ?, education = ?, address = ?, salary = ? WHERE id = ?`,
    [name || existing.name, role || existing.role, contact || '', education || '', address || '', Number(salary) || 0, params.id]
  );
  if (password && password.trim()) {
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash.hashSync(password), params.id]);
  }
  return { success: true };
}

async function deleteEmployee(db, { params, user }) {
  requireRole(user, 'owner');
  if (Number(params.id) === user.id) throw httpError(400, 'You cannot delete your own account.');
  await db.run('UPDATE users SET active = 0 WHERE id = ?', [params.id]);
  return { success: true };
}

async function listTransactions(db, { query, user }) {
  requireRole(user, 'owner');
  let sql = `SELECT t.*, u.name AS employee_name FROM hr_transactions t JOIN users u ON u.id = t.employee_id WHERE 1=1`;
  const params = [];
  if (query.employee_id) { sql += ' AND t.employee_id = ?'; params.push(query.employee_id); }
  sql += ' ORDER BY t.payment_date DESC, t.created_at DESC';
  return db.all(sql, params);
}

async function createTransaction(db, { body, user }) {
  requireRole(user, 'owner');
  const { employee_id, type, amount, month, description, payment_date } = body || {};
  if (!employee_id || !['salary', 'expense'].includes(type) || !amount) {
    throw httpError(400, 'Employee, type, and amount are required.');
  }
  const info = await db.run(
    `INSERT INTO hr_transactions (employee_id, type, amount, month, description, payment_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [employee_id, type, Number(amount), month || '', description || '', payment_date || new Date().toISOString().slice(0, 10)]
  );
  return db.get('SELECT * FROM hr_transactions WHERE id = ?', [info.lastInsertRowid]);
}

// Section 6: edit an existing salary/expense record.
async function updateTransaction(db, { params, body, user }) {
  requireRole(user, 'owner');
  const existing = await db.get('SELECT * FROM hr_transactions WHERE id = ?', [params.id]);
  if (!existing) throw httpError(404, 'Record not found.');

  const { amount, month, description, payment_date } = body || {};
  await db.run(
    `UPDATE hr_transactions SET amount = ?, month = ?, description = ?, payment_date = ? WHERE id = ?`,
    [
      amount !== undefined ? Number(amount) : existing.amount,
      month !== undefined ? month : existing.month,
      description !== undefined ? description : existing.description,
      payment_date || existing.payment_date,
      params.id
    ]
  );
  return db.get('SELECT * FROM hr_transactions WHERE id = ?', [params.id]);
}

module.exports = {
  listEmployees, me, createEmployee, updateEmployee, deleteEmployee,
  listTransactions, createTransaction, updateTransaction
};
