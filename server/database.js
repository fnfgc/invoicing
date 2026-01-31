const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Connect to SQLite database
// In production (Electron), use APPDATA. In dev, use local file.
const isElectron = process.versions.electron || process.env.IS_ELECTRON;
const userDataPath = process.env.USER_DATA_PATH || (isElectron ? (process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share")) : __dirname);
const dbPath = process.env.DB_PATH || path.resolve(userDataPath, 'pos.db');

// Ensure directory exists if using a custom path
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`Using Database at: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database ' + dbPath + ': ' + err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Initialize Database Tables
db.serialize(() => {
  // Users Table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  )`);

  // Products Table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL,
    pctCode TEXT,
    taxRate REAL DEFAULT 17.0
  )`);

  // Invoices Table
  db.run(`CREATE TABLE IF NOT EXISTS invoices (
    invoiceNumber TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    totalAmount REAL NOT NULL,
    buyerName TEXT,
    buyerCNIC TEXT,
    buyerNTN TEXT,
    buyerPhone TEXT,
    fbrResponse TEXT
  )`);

  // Invoice Items Table (Relational)
  db.run(`CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoiceNumber TEXT,
    productId TEXT,
    productName TEXT,
    quantity INTEGER,
    price REAL,
    total REAL,
    FOREIGN KEY(invoiceNumber) REFERENCES invoices(invoiceNumber)
  )`);

  // Settings Table for Activation/License
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);
});

// Migration Helper: Load JSON data if tables are empty
const migrateData = () => {
  // Check if users exist
  db.get("SELECT count(*) as count FROM users", (err, row) => {
    if (err) return console.error(err);
    if (row.count === 0) {
      console.log("Migrating Users from JSON...");
      try {
        if (fs.existsSync('./users.json')) {
          const users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));
          const stmt = db.prepare("INSERT INTO users (id, name, username, password, role) VALUES (?, ?, ?, ?, ?)");
          users.forEach(u => {
            stmt.run(u.id, u.name, u.username, u.password, u.role);
          });
          stmt.finalize();
          console.log("Users migrated.");
        }
      } catch (e) { console.error("User migration failed:", e); }
    }
  });

  // Check if products exist
  db.get("SELECT count(*) as count FROM products", (err, row) => {
    if (err) return console.error(err);
    if (row.count === 0) {
      console.log("Migrating Products from JSON...");
      try {
        if (fs.existsSync('./products.json')) {
          const products = JSON.parse(fs.readFileSync('./products.json', 'utf8'));
          const stmt = db.prepare("INSERT INTO products (id, name, price, stock, pctCode, taxRate) VALUES (?, ?, ?, ?, ?, ?)");
          products.forEach(p => {
            stmt.run(p.id, p.name, p.price, p.stock, p.pctCode || '', p.taxRate || 17);
          });
          stmt.finalize();
          console.log("Products migrated.");
        }
      } catch (e) { console.error("Product migration failed:", e); }
    }
  });

  // Check if invoices exist
  db.get("SELECT count(*) as count FROM invoices", (err, row) => {
    if (err) return console.error(err);
    if (row.count === 0) {
      console.log("Migrating Invoices from JSON...");
      try {
        if (fs.existsSync('./invoices.json')) {
          const invoices = JSON.parse(fs.readFileSync('./invoices.json', 'utf8'));
          const invStmt = db.prepare("INSERT INTO invoices (invoiceNumber, date, totalAmount, buyerName, buyerCNIC, buyerNTN, buyerPhone, fbrResponse) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
          const itemStmt = db.prepare("INSERT INTO invoice_items (invoiceNumber, productId, productName, quantity, price, total) VALUES (?, ?, ?, ?, ?, ?)");
          
          db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            invoices.forEach(inv => {
              invStmt.run(
                inv.invoiceNumber, 
                inv.date, 
                inv.totalAmount || 0, 
                inv.buyerInfo?.name || '', 
                inv.buyerInfo?.cnic || '', 
                inv.buyerInfo?.ntn || '', 
                inv.buyerInfo?.phone || '', 
                JSON.stringify(inv.fbrResponse || {})
              );

              if (inv.items) {
                inv.items.forEach(item => {
                  itemStmt.run(
                    inv.invoiceNumber,
                    item.id,
                    item.name,
                    item.quantity,
                    item.price,
                    (item.price * item.quantity)
                  );
                });
              }
            });
            db.run("COMMIT");
          });
          invStmt.finalize();
          itemStmt.finalize();
          console.log("Invoices migrated.");
        }
      } catch (e) { console.error("Invoice migration failed:", e); }
    }
  });
};

// Run migration after a short delay to ensure tables are ready
setTimeout(migrateData, 1000);

module.exports = db;
