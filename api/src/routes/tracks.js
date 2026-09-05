const express = require("express");
const multer = require("multer");
const path = require("path");
const db = require("../db");
const liquidsoap = require("../liquidsoap");

const MUSIC_DIR = process.env.MUSIC_DIR || "/music";
const ALLOWED_EXT = new Set([".mp3", ".ogg", ".wav", ".flac", ".m4a"]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, MUSIC_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base =
      path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .trim()
        .replace(/\s+/g, "-") || "track";
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return cb(new Error(`Unsupported file type: ${ext}`));
    }
    cb(null, true);
  },
});

const router = express.Router();

router.get("/", (req, res) => {
  const tracks = db.prepare("SELECT * FROM tracks ORDER BY position ASC").all();
  res.json(tracks);
});

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded (expected field "file")' });
  }
  const { title, artist } = req.body;
  const maxPosition = db.prepare("SELECT COALESCE(MAX(position), 0) AS max FROM tracks").get().max;
  const info = db
    .prepare("INSERT INTO tracks (filename, title, artist, position) VALUES (?, ?, ?, ?)")
    .run(req.file.filename, title || req.file.originalname, artist || null, maxPosition + 1);

  const track = db.prepare("SELECT * FROM tracks WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(track);
});

router.delete("/:id", (req, res) => {
  const track = db.prepare("SELECT * FROM tracks WHERE id = ?").get(req.params.id);
  if (!track) return res.status(404).json({ error: "Track not found" });
  db.prepare("DELETE FROM tracks WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

// Jumps this track to the front of Liquidsoap's live queue right now.
router.post("/:id/play-next", async (req, res) => {
  const track = db.prepare("SELECT * FROM tracks WHERE id = ?").get(req.params.id);
  if (!track) return res.status(404).json({ error: "Track not found" });

  try {
    const filePath = path.join(MUSIC_DIR, track.filename);
    const requestId = await liquidsoap.sendCommand(`queue.push ${filePath}`);
    db.prepare("UPDATE tracks SET status = 'playing' WHERE id = ?").run(track.id);
    res.json({ ok: true, requestId });
  } catch (err) {
    res.status(502).json({ error: `Liquidsoap error: ${err.message}` });
  }
});

module.exports = router;
