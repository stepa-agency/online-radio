const express = require("express");
const db = require("../db");

const MESSAGE_KEY = "announcement";
const router = express.Router();

router.get("/message", (req, res) => {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(MESSAGE_KEY);
  res.json({ text: row?.value || "" });
});

router.put("/message", (req, res) => {
  const { text } = req.body;
  if (typeof text !== "string") {
    return res.status(400).json({ error: "text must be a string" });
  }
  db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(MESSAGE_KEY, text);
  res.json({ text });
});

module.exports = router;
