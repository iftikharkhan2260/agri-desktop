// schema.js — identical copy lives in server/handlers/schema.js for the
// optional Node relay. Keep both in sync if you change this file.

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner','manager','salesman','support_staff')),
  contact TEXT,
  education TEXT,
  address TEXT,
  salary REAL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS shop_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  shop_name TEXT NOT NULL DEFAULT 'My Agri Shop',
  logo_path TEXT,
  contact TEXT,
  address TEXT,
  branch_name TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS zamindars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT,
  address TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS guarantors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company_name TEXT,
  contact TEXT,
  address TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS kisans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mark_name TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  zamindar_id INTEGER REFERENCES zamindars(id),
  guarantor_id INTEGER REFERENCES guarantors(id),
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  image_path TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS item_sizes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES items(id),
  size_label TEXT NOT NULL,
  price REAL NOT NULL,
  stock_qty REAL NOT NULL DEFAULT 0,
  deleted INTEGER NOT NULL DEFAULT 0
);

-- Section 2: full audit trail of every stock addition (what/how much/when/by whom).
CREATE TABLE IF NOT EXISTS stock_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES items(id),
  item_size_id INTEGER REFERENCES item_sizes(id),
  item_name TEXT NOT NULL,
  size_label TEXT NOT NULL,
  qty_added REAL NOT NULL,
  price_at_time REAL,
  added_by INTEGER REFERENCES users(id),
  added_by_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  salesman_id INTEGER REFERENCES users(id),
  is_cash INTEGER NOT NULL DEFAULT 0,
  receiver_name TEXT,
  kisan_id INTEGER REFERENCES kisans(id),
  zamindar_id INTEGER REFERENCES zamindars(id),
  guarantor_id INTEGER REFERENCES guarantors(id),
  total_amount REAL NOT NULL DEFAULT 0,
  settled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  item_size_id INTEGER NOT NULL REFERENCES item_sizes(id),
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_no TEXT NOT NULL UNIQUE,
  received_from TEXT,
  received_by INTEGER REFERENCES users(id),
  kisan_id INTEGER REFERENCES kisans(id),
  guarantor_id INTEGER REFERENCES guarantors(id),
  total_amount REAL NOT NULL DEFAULT 0,
  collected INTEGER NOT NULL DEFAULT 0,
  is_cash INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payment_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL REFERENCES payments(id),
  order_id INTEGER NOT NULL REFERENCES orders(id),
  amount REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_id TEXT NOT NULL UNIQUE,
  collected_by INTEGER REFERENCES users(id),
  total_amount REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS collection_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_id INTEGER NOT NULL REFERENCES collections(id),
  payment_id INTEGER NOT NULL REFERENCES payments(id),
  amount REAL NOT NULL
);

-- Section 6: payment_date is the (editable) date the salary/expense was paid;
-- created_at stays as the immutable record-creation timestamp.
CREATE TABLE IF NOT EXISTS hr_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK(type IN ('salary','expense')),
  amount REAL NOT NULL,
  month TEXT,
  description TEXT,
  payment_date TEXT NOT NULL DEFAULT (date('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

async function seedDefaults(db, ownerPasswordHash) {
  const owner = await db.get("SELECT id FROM users WHERE role = 'owner' LIMIT 1");
  if (!owner) {
    await db.run(
      `INSERT INTO users (name, username, password_hash, role) VALUES (?, ?, ?, 'owner')`,
      ['Shop Owner', 'owner', ownerPasswordHash]
    );
  }
  const settings = await db.get('SELECT id FROM shop_settings WHERE id = 1');
  if (!settings) {
    await db.run(
      `INSERT INTO shop_settings (id, shop_name, address, branch_name, contact) VALUES (1, 'My Agri Shop', '', 'Main', '')`
    );
  }
}

module.exports = { SCHEMA_SQL, seedDefaults };
