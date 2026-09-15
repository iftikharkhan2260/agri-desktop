const passwordHash = require('../passwordHash');
const { httpError } = require('./helpers');

async function login(db, { body }) {
  const { username, password } = body || {};
  if (!username || !password) throw httpError(400, 'Username and password are required.');

  const user = await db.get('SELECT * FROM users WHERE username = ? AND active = 1', [username]);
  if (!user || !passwordHash.compareSync(password, user.password_hash)) {
    throw httpError(401, 'Invalid username or password.');
  }

  const safeUser = { id: user.id, name: user.name, username: user.username, role: user.role };
  return { user: safeUser };
}

async function me(db, { user }) {
  if (!user) throw httpError(401, 'Not authenticated.');
  const row = await db.get('SELECT id, name, username, role FROM users WHERE id = ? AND active = 1', [user.id]);
  if (!row) throw httpError(401, 'Session no longer valid.');
  return { user: row };
}

module.exports = { login, me };
