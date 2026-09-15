// dbAdapter.js (Node relay side) — wraps better-sqlite3 (synchronous) into
// the SAME {exec, all, get, run, tx} async interface the in-app host uses,
// so handlers/*.js is byte-identical between server/ and app/src/localapi/.

const path = require('path');
const Database = require('better-sqlite3');
const passwordHash = require('./passwordHash');
const { SCHEMA_SQL, seedDefaults } = require('./schema');

const dbPath = path.join(__dirname, 'agri_shop.db');
const raw = new Database(dbPath);
raw.pragma('journal_mode = WAL');
raw.pragma('foreign_keys = ON');
raw.exec(SCHEMA_SQL);

const adapter = {
  async exec(sql) {
    raw.exec(sql);
  },
  async all(sql, params = []) {
    return raw.prepare(sql).all(...params);
  },
  async get(sql, params = []) {
    return raw.prepare(sql).get(...params);
  },
  async run(sql, params = []) {
    const info = raw.prepare(sql).run(...params);
    return { lastInsertRowid: info.lastInsertRowid, changes: info.changes };
  },
  async tx(fn) {
    raw.exec('BEGIN');
    try {
      const result = await fn();
      raw.exec('COMMIT');
      return result;
    } catch (err) {
      try { raw.exec('ROLLBACK'); } catch { /* ignore if already rolled back */ }
      throw err;
    }
  }
};

const ownerHash = passwordHash.hashSync('owner123');
seedDefaults(adapter, ownerHash);

module.exports = adapter;
