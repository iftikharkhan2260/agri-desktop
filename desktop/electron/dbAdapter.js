// dbAdapter.js (Electron main process) — same {exec, all, get, run, tx}
// interface as the mobile app's and the Node relay's, so handlers/*.js is
// byte-identical across all three. Electron's main process is plain
// Node.js, so better-sqlite3 (synchronous, fast) works directly here after
// electron-rebuild during the build step (see package.json).

const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');
const passwordHash = require('./passwordHash');
const { SCHEMA_SQL, seedDefaults } = require('./schema');

// Store the real shop database in the OS's standard per-app data folder
// (e.g. %APPDATA%/AgriShop on Windows, ~/Library/Application Support/AgriShop
// on Mac, ~/.config/AgriShop on Linux) so it survives app updates and isn't
// buried inside the installed program's own folder.
const dbPath = path.join(app.getPath('userData'), 'agri_shop.db');
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
      try { raw.exec('ROLLBACK'); } catch { /* already rolled back */ }
      throw err;
    }
  },
  getDbPath() {
    return dbPath;
  }
};

const readyPromise = seedDefaults(adapter, passwordHash.hashSync('owner123'));
adapter.ready = () => readyPromise;

module.exports = adapter;
