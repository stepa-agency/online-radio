const express = require("express");
const multer = require("multer");
const path = require("path");
const mm = require("music-metadata");
const db = require("../db");
const liquidsoap = require("../liquidsoap");

const MUSIC_DIR = process.env.MUSIC_DIR || "/music";
const ALLOWED_EXT = new Set([".mp3", ".ogg", ".wav", ".flac", ".m4a", ".m4b"]);

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
  // No size cap — podcasts and audiobook chapters can run for hours.
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

router.post("/", upload.array("file", 25), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded (expected field "file")' });
  }

  // Reading duration needs to open and parse each file, which is too slow
  // to do inside the DB transaction below — resolve them all up front.
  const durations = await Promise.all(
    req.files.map(async (file) => {
      try {
        const metadata = await mm.parseFile(path.join(MUSIC_DIR, file.filename));
        return metadata.format.duration || null;
      } catch {
        return null;
      }
    })
  );

  const maxPosition = db.prepare("SELECT COALESCE(MAX(position), 0) AS max FROM tracks").get().max;
  const insert = db.prepare(
    "INSERT INTO tracks (filename, title, position, duration_seconds) VALUES (?, ?, ?, ?)"
  );

  const tracks = req.files.map((file, i) => {
    const info = insert.run(file.filename, file.originalname, maxPosition + i + 1, durations[i]);
    return db.prepare("SELECT * FROM tracks WHERE id = ?").get(info.lastInsertRowid);
  });

  res.status(201).json(tracks);
});

router.delete("/:id", async (req, res) => {
  const track = db.prepare("SELECT * FROM tracks WHERE id = ?").get(req.params.id);
  if (!track) return res.status(404).json({ error: "Track not found" });

  if (track.status === "playing") {
    try {
      await liquidsoap.sendCommand("radio.skip");
    } catch (err) {
      return res.status(502).json({ error: `Liquidsoap error: ${err.message}` });
    }
  }

  db.prepare("DELETE FROM tracks WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

// Swaps this track's spot in the queue with the neighbor immediately above
// or below it. Only 'queued' tracks are reorderable — whatever's 'playing'
// is already on air, and a 'cued' track has already been handed to
// Liquidsoap for the moment the current one ends, so moving it in our own
// list wouldn't actually change what plays next.
router.post("/:id/move", (req, res) => {
  const { direction } = req.body || {};
  if (direction !== "up" && direction !== "down") {
    return res.status(400).json({ error: 'direction must be "up" or "down"' });
  }

  const track = db.prepare("SELECT * FROM tracks WHERE id = ?").get(req.params.id);
  if (!track) return res.status(404).json({ error: "Track not found" });
  if (track.status !== "queued") {
    return res.status(400).json({ error: "Only queued tracks can be reordered" });
  }

  const neighbor =
    direction === "up"
      ? db
          .prepare("SELECT * FROM tracks WHERE status = 'queued' AND position < ? ORDER BY position DESC LIMIT 1")
          .get(track.position)
      : db
          .prepare("SELECT * FROM tracks WHERE status = 'queued' AND position > ? ORDER BY position ASC LIMIT 1")
          .get(track.position);

  if (!neighbor) return res.json({ ok: true }); // already at that end of the queue

  const swap = db.transaction(() => {
    db.prepare("UPDATE tracks SET position = ? WHERE id = ?").run(neighbor.position, track.id);
    db.prepare("UPDATE tracks SET position = ? WHERE id = ?").run(track.position, neighbor.id);
  });
  swap();

  res.json({ ok: true });
});

// Cuts off whatever's on air (if anything) and plays this track immediately,
// ahead of the rest of the queue. The auto-advance loop picks up from here
// once it finishes — normal queue order resumes after it.
router.post("/:id/play-now", async (req, res) => {
  const track = db.prepare("SELECT * FROM tracks WHERE id = ?").get(req.params.id);
  if (!track) return res.status(404).json({ error: "Track not found" });

  try {
    await liquidsoap.sendCommand("queue.flush_and_skip");
    const filePath = path.join(MUSIC_DIR, track.filename);
    await liquidsoap.sendCommand(`queue.push ${filePath}`);
    // flush_and_skip drops anything auto-advance had pre-loaded for later
    // (see autoAdvance.js's 'cued' status), so that bookkeeping needs
    // clearing too, not just whatever was 'playing'.
    db.prepare("DELETE FROM tracks WHERE status IN ('playing', 'cued') AND id != ?").run(track.id);
    db.prepare("UPDATE tracks SET status = 'playing' WHERE id = ?").run(track.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: `Liquidsoap error: ${err.message}` });
  }
});

module.exports = router;
