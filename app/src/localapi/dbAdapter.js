// dbAdapter.js (Expo/app side) — wraps expo-sqlite's async API into the
// generic {exec, all, get, run, tx} interface that handlers/*.js expect.
// The Node relay (server/dbAdapter.js) implements the SAME interface over
// better-sqlite3, so handlers/*.js is byte-identical in both places.

const SQLite = require('expo-sqlite');
const passwordHash = require('./passwordHash');
const { SCHEMA_SQL, seedDefaults } = require('./schema');

let dbInstance = null;
let readyPromise = null;

function normalizeRunResult(raw) {
  return { lastInsertRowid: raw.lastInsertRowId, changes: raw.changes };
}

async function init() {
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    dbInstance = await SQLite.openDatabaseAsync('agri_shop.db');
    await dbInstance.execAsync('PRAGMA journal_mode = WAL;');
    await dbInstance.execAsync('PRAGMA foreign_keys = ON;');
    await dbInstance.execAsync(SCHEMA_SQL);

    const ownerHash = passwordHash.hashSync('owner123');
    await seedDefaults(adapter, ownerHash);
  })();

  return readyPromise;
}

const adapter = {
  async exec(sql) {
    await init();
    return dbInstance.execAsync(sql);
  },
  async all(sql, params = []) {
    await init();
    return dbInstance.getAllAsync(sql, params);
  },
  async get(sql, params = []) {
    await init();
    const row = await dbInstance.getFirstAsync(sql, params);
    return row || undefined;
  },
  async run(sql, params = []) {
    await init();
    const raw = await dbInstance.runAsync(sql, params);
    return normalizeRunResult(raw);
  },
  async tx(fn) {
    await init();
    let result;
    await dbInstance.withTransactionAsync(async () => {
      result = await fn();
    });
    return result;
  },
  ready: init
};

module.exports = adapter;
