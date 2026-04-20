/**
 * Builddy SaaS Scaffold — Database Module
 * SQLite with newsletter_subscribers table, WAL mode, and CRUD helpers.
 *
 * Modification Points:
 *   // {{SCHEMA_INSERTION_POINT}}  — Add CREATE TABLE statements here
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "app.db");

let _db = null;

/**
 * Get or create the singleton database connection.
 * Configures WAL mode for better concurrent read performance.
 */
export function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    console.log(`[db] SQLite database opened at ${DB_PATH} (WAL mode)`);
  }
  return _db;
}

// ---------------------------------------------------------------------------
// Schema Initialisation
// ---------------------------------------------------------------------------

export function initSchema() {
  const db = getDb();

  // Newsletter subscribers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT    UNIQUE NOT NULL,
      source        TEXT    DEFAULT 'landing',
      subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active     BOOLEAN DEFAULT 1
    );
  `);

  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_email ON newsletter_subscribers(email);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_subscribers_active ON newsletter_subscribers(is_active);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_subscribers_source ON newsletter_subscribers(source);`);

  // {{SCHEMA_INSERTION_POINT}}
  // Add your CREATE TABLE statements above this line.

  console.log("[db] Schema initialised.");
}

// ---------------------------------------------------------------------------
// Generic CRUD Helpers
// ---------------------------------------------------------------------------

export function getAll(table, orderCol = "id") {
  const db = getDb();
  const sql = `SELECT * FROM ${table} ORDER BY ${orderCol}`;
  return db.prepare(sql).all();
}

export function getById(table, id) {
  const db = getDb();
  const sql = `SELECT * FROM ${table} WHERE id = ?`;
  return db.prepare(sql).get(id);
}

export function getWhere(table, filters, orderCol = "id") {
  const db = getDb();
  const cols = Object.keys(filters);
  const vals = Object.values(filters);
  const where = cols.map((c) => `${c} = ?`).join(" AND ");
  const sql = `SELECT * FROM ${table} WHERE ${where} ORDER BY ${orderCol}`;
  return db.prepare(sql).all(...vals);
}

export function getOneWhere(table, filters) {
  const db = getDb();
  const cols = Object.keys(filters);
  const vals = Object.values(filters);
  const where = cols.map((c) => `${c} = ?`).join(" AND ");
  const sql = `SELECT * FROM ${table} WHERE ${where} LIMIT 1`;
  return db.prepare(sql).get(...vals);
}

export function create(table, data) {
  const db = getDb();
  const cols = Object.keys(data);
  const vals = Object.values(data);
  const placeholders = cols.map(() => "?").join(", ");
  const sql = `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`;
  const info = db.prepare(sql).run(...vals);
  return getById(table, info.lastInsertRowid);
}

export function update(table, id, data) {
  const db = getDb();
  const cols = Object.keys(data);
  const vals = Object.values(data);
  const setClause = cols.map((c) => `${c} = ?`).join(", ");
  const sql = `UPDATE ${table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  db.prepare(sql).run(...vals, id);
  return getById(table, id);
}

export function deleteRow(table, id) {
  const db = getDb();
  const sql = `DELETE FROM ${table} WHERE id = ?`;
  const info = db.prepare(sql).run(id);
  return info.changes > 0;
}

export function runQuery(sql, params = []) {
  const db = getDb();
  return db.prepare(sql).all(...params);
}

// ---------------------------------------------------------------------------
// Newsletter Subscriber Helpers
// ---------------------------------------------------------------------------

export function addSubscriber(email, source = "landing") {
  const db = getDb();
  const existing = db.prepare(
    `SELECT * FROM newsletter_subscribers WHERE email = ?`
  ).get(email);

  if (existing) {
    if (!existing.is_active) {
      db.prepare(
        `UPDATE newsletter_subscribers SET is_active = 1, source = ? WHERE id = ?`
      ).run(source, existing.id);
      return getById("newsletter_subscribers", existing.id);
    }
    return existing;
  }

  const info = db.prepare(
    `INSERT INTO newsletter_subscribers (email, source) VALUES (?, ?)`
  ).run(email, source);
  return getById("newsletter_subscribers", info.lastInsertRowid);
}

export function getSubscribers(page = 1, limit = 20) {
  const db = getDb();
  const offset = (page - 1) * limit;
  const rows = db.prepare(
    `SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC LIMIT ? OFFSET ?`
  ).all(limit, offset);
  const total = db.prepare(
    `SELECT COUNT(*) as count FROM newsletter_subscribers`
  ).get().count;
  return { rows, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export function getSubscriberCount() {
  const db = getDb();
  return db.prepare(
    `SELECT COUNT(*) as count FROM newsletter_subscribers WHERE is_active = 1`
  ).get().count;
}

export function removeSubscriber(id) {
  const db = getDb();
  const info = db.prepare(
    `UPDATE newsletter_subscribers SET is_active = 0 WHERE id = ?`
  ).run(id);
  return info.changes > 0;
}

// ---------------------------------------------------------------------------
// Graceful Shutdown
// ---------------------------------------------------------------------------

export function closeDb() {
  if (_db) {
    _db.close();
    _db = null;
    console.log("[db] Database connection closed.");
  }
}

process.on("SIGINT", () => { closeDb(); process.exit(0); });
process.on("SIGTERM", () => { closeDb(); process.exit(0); });