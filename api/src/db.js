const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "queue.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Single writer, low volume: the default rollback journal commits straight
// to the main file after every transaction. WAL buffers writes in a
// separate file until checkpointed, which was silently losing rows here
// whenever the container was killed before a checkpoint happened. Journal
// mode is stored in the file itself, so this must be set explicitly even
// though we never opt into WAL — an older run of this file may have left
// it in WAL mode.
db.pragma("journal_mode = DELETE");

db.exec(`
  CREATE TABLE IF NOT EXISTS tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    title TEXT,
    artist TEXT,
    position INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// duration_seconds was added after the table already existed in production —
// CREATE TABLE IF NOT EXISTS above is a no-op on an existing file, so the
// column has to be added out-of-band, once, for anyone upgrading in place.
const hasDuration = db.prepare("PRAGMA table_info(tracks)").all().some((col) => col.name === "duration_seconds");
if (!hasDuration) {
  db.exec("ALTER TABLE tracks ADD COLUMN duration_seconds REAL");
}

module.exports = db;
