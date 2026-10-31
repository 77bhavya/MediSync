const mysql = require('mysql2/promise');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

let dbType = 'none'; // 'mysql' | 'sqlite'
let mysqlPool = null;
let sqliteDb = null;
let sqliteFilePath = path.join(__dirname, '../../database/medisync.sqlite');

/**
 * Automatically set up MySQL schema and tables if they don't exist
 */
async function ensureMySQLSchema(dbName) {
  try {
    // 1. Check if tables exist in MySQL
    const [tables] = await mysqlPool.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
      [dbName]
    );

    if (!tables || tables.length === 0) {
      console.log(`[MediSync MySQL] Creating tables in database: ${dbName}...`);
      const schemaPath = path.join(__dirname, '../../database/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await mysqlPool.query(schemaSql);
        console.log(`[MediSync MySQL] schema.sql executed successfully.`);
      }

      // Check if users exist, if not seed
      const [users] = await mysqlPool.query(`SELECT id FROM users LIMIT 1`);
      if (!users || users.length === 0) {
        console.log(`[MediSync MySQL] Seeding initial demo data into MySQL...`);
        const seedPath = path.join(__dirname, '../../database/seed.sql');
        if (fs.existsSync(seedPath)) {
          const seedSql = fs.readFileSync(seedPath, 'utf8');
          await mysqlPool.query(seedSql);
          console.log(`[MediSync MySQL] seed.sql executed successfully.`);
        }
      }
    }
  } catch (err) {
    console.warn(`[MediSync MySQL] Schema auto-creation note: ${err.message}`);
  }
}

/**
 * Initialize Database Connection
 * First attempts to connect to MySQL if configured.
 * If MySQL fails or DB_CLIENT is sqlite, falls back to sql.js (SQLite file).
 */
async function initDatabase() {
  const preferClient = (process.env.DB_CLIENT || 'auto').toLowerCase();
  const dbName = process.env.DB_NAME || 'medisync_db';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';

  if (preferClient === 'mysql' || preferClient === 'auto') {
    try {
      // Step A: Attempt connecting to server to ensure database exists
      try {
        const adminConn = await mysql.createConnection({
          host: dbHost,
          port: dbPort,
          user: dbUser,
          password: dbPassword,
          connectTimeout: 2000,
        });
        await adminConn.query(
          `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
        );
        await adminConn.end();
      } catch (adminErr) {
        // If connecting without db fails, continue to pool attempt
      }

      // Step B: Create MySQL connection pool
      const pool = mysql.createPool({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        multipleStatements: true,
        connectTimeout: 2000,
      });

      // Test connection
      const connection = await pool.getConnection();
      connection.release();
      mysqlPool = pool;
      dbType = 'mysql';
      console.log(`[MediSync DB] Successfully connected to MySQL database: ${dbName} (${dbHost}:${dbPort})`);

      // Ensure MySQL schema and tables exist
      await ensureMySQLSchema(dbName);

      return { dbType, pool: mysqlPool };
    } catch (err) {
      if (preferClient === 'mysql') {
        console.error('[MediSync DB] MySQL connection failed and DB_CLIENT=mysql was requested:', err.message);
        throw err;
      }
      console.warn(`[MediSync DB] MySQL not available (${err.code || err.message}). Falling back to embedded SQLite storage.`);
    }
  }

  // SQLite fallback using sql.js
  const SQL = await initSqlJs();
  let fileBuffer = null;
  const dbDir = path.dirname(sqliteFilePath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (fs.existsSync(sqliteFilePath)) {
    fileBuffer = fs.readFileSync(sqliteFilePath);
    sqliteDb = new SQL.Database(fileBuffer);
  } else {
    sqliteDb = new SQL.Database();
  }

  dbType = 'sqlite';
  console.log(`[MediSync DB] Initialized embedded SQLite database (${sqliteFilePath})`);

  // Ensure tables exist in SQLite
  ensureSqliteTables();
  saveSqliteToFile();

  return { dbType, sqliteDb };
}

function saveSqliteToFile() {
  if (dbType === 'sqlite' && sqliteDb) {
    try {
      const data = sqliteDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(sqliteFilePath, buffer);
    } catch (e) {
      console.error('[MediSync DB] Failed to save SQLite file:', e.message);
    }
  }
}

function ensureSqliteTables() {
  if (!sqliteDb) return;

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      phone TEXT,
      timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notification_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      browser_notifications INTEGER NOT NULL DEFAULT 1,
      sound_enabled INTEGER NOT NULL DEFAULT 1,
      lead_time_minutes INTEGER NOT NULL DEFAULT 10,
      snooze_duration_minutes INTEGER NOT NULL DEFAULT 15,
      email_notifications INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      form TEXT NOT NULL DEFAULT 'Tablet',
      frequency TEXT NOT NULL DEFAULT 'Once daily',
      scheduled_times TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      quantity INTEGER NOT NULL DEFAULT 0,
      refill_threshold INTEGER NOT NULL DEFAULT 5,
      instructions TEXT NOT NULL DEFAULT 'After food',
      notes TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dose_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      medicine_id INTEGER NOT NULL,
      scheduled_date TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'missed',
      action_timestamp DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
      UNIQUE (medicine_id, scheduled_date, scheduled_time)
    );

    CREATE TABLE IF NOT EXISTS stock_refills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      medicine_id INTEGER NOT NULL,
      quantity_added INTEGER NOT NULL,
      refill_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
    );
  `);
}

/**
 * Execute parameterized query
 * Translates query and returns [rowsOrResult, fields] matching mysql2 format
 */
async function query(sql, params = []) {
  if (dbType === 'none') {
    await initDatabase();
  }

  if (dbType === 'mysql') {
    return await mysqlPool.query(sql, params);
  }

  // SQLite execution via sql.js
  const normalizedParams = (params || []).map((p) => {
    if (p === undefined) return null;
    if (typeof p === 'boolean') return p ? 1 : 0;
    return p;
  });

  const trimmedSql = sql.trim();
  const isSelect = /^SELECT/i.test(trimmedSql) || /^WITH/i.test(trimmedSql) || /^PRAGMA/i.test(trimmedSql);

  if (isSelect) {
    try {
      const stmt = sqliteDb.prepare(trimmedSql);
      stmt.bind(normalizedParams);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return [rows, []];
    } catch (err) {
      throw new Error(`[SQLite SELECT Error]: ${err.message} in: ${trimmedSql}`);
    }
  } else {
    try {
      sqliteDb.run(trimmedSql, normalizedParams);
      saveSqliteToFile();

      let insertId = 0;
      let affectedRows = 0;
      try {
        const idRes = sqliteDb.exec('SELECT last_insert_rowid() as id, changes() as affected');
        if (idRes.length > 0 && idRes[0].values.length > 0) {
          insertId = idRes[0].values[0][0];
          affectedRows = idRes[0].values[0][1];
        }
      } catch (ignored) {}

      return [{ insertId, affectedRows }, []];
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('unique constraint failed')) {
        const customErr = new Error('Duplicate entry or unique constraint violation.');
        customErr.code = 'ER_DUP_ENTRY';
        throw customErr;
      }
      throw new Error(`[SQLite Mutation Error]: ${err.message} in: ${trimmedSql}`);
    }
  }
}

/**
 * Convenience method matching mysql2 execute
 */
async function execute(sql, params = []) {
  return query(sql, params);
}

function getDbType() {
  return dbType;
}

module.exports = {
  initDatabase,
  query,
  execute,
  getDbType,
  saveSqliteToFile,
};
