const path = require("path");
const db = require("./db");
const liquidsoap = require("./liquidsoap");

const MUSIC_DIR = process.env.MUSIC_DIR || "/music";

function parseFields(raw) {
  const fields = {};
  for (const line of raw.trim().split("\n")) {
    const match = line.match(/^(\w+)="(.*)"$/);
    if (match) fields[match[1]] = match[2];
  }
  return fields;
}

let running = false;

// Keeps the station fed: whatever's marked "playing" that's no longer
// actually on air gets dropped, and if nothing is on air, the next queued
// track is pushed. This is what makes the queue a real auto-advancing
// playlist instead of something you have to click through track by track.
async function tick() {
  if (running) return;
  running = true;
  try {
    const onAirRaw = await liquidsoap.sendCommand("request.on_air");
    const onAirRid = onAirRaw.trim().split(/\s+/)[0] || null;

    let onAirFilename = null;
    if (onAirRid) {
      const meta = await liquidsoap.sendCommand(`request.metadata ${onAirRid}`);
      const fields = parseFields(meta);
      onAirFilename = fields.filename ? path.basename(fields.filename) : null;
    }

    const current = db.prepare("SELECT * FROM tracks WHERE status = 'playing'").get();
    if (current && current.filename !== onAirFilename) {
      db.prepare("DELETE FROM tracks WHERE id = ?").run(current.id);
    }

    if (!onAirFilename) {
      const next = db
        .prepare("SELECT * FROM tracks WHERE status = 'queued' ORDER BY position ASC LIMIT 1")
        .get();
      if (next) {
        const filePath = path.join(MUSIC_DIR, next.filename);
        await liquidsoap.sendCommand(`queue.push ${filePath}`);
        db.prepare("UPDATE tracks SET status = 'playing' WHERE id = ?").run(next.id);
      }
    }
  } catch {
    // Liquidsoap not reachable this tick — just try again next time.
  } finally {
    running = false;
  }
}

function startAutoAdvance(intervalMs = 4000) {
  tick();
  return setInterval(tick, intervalMs);
}

module.exports = { startAutoAdvance };
