const express = require("express");
const db = require("../db");

const router = express.Router();

const NICKNAME_MAX = 24;
const TEXT_MAX = 500;
const HISTORY_LIMIT = 200;

// Public and permanent by design — anyone can post under any nickname
// (no accounts), and nothing here ever gets deleted automatically.
router.get("/chat", (req, res) => {
  const rows = db
    .prepare("SELECT id, nickname, text, created_at FROM messages ORDER BY id DESC LIMIT ?")
    .all(HISTORY_LIMIT);
  res.json(rows.reverse());
});

router.post("/chat", (req, res) => {
  const nickname = String(req.body?.nickname || "").trim().slice(0, NICKNAME_MAX);
  const text = String(req.body?.text || "").trim().slice(0, TEXT_MAX);
  if (!nickname || !text) {
    return res.status(400).json({ error: "nickname and text are both required" });
  }

  const info = db
    .prepare("INSERT INTO messages (nickname, text) VALUES (?, ?)")
    .run(nickname, text);
  const row = db.prepare("SELECT id, nickname, text, created_at FROM messages WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(row);
});

module.exports = router;
