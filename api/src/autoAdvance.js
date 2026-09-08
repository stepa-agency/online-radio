const path = require("path");
const db = require("./db");
const liquidsoap = require("./liquidsoap");

const MUSIC_DIR = process.env.MUSIC_DIR || "/music";

// How close to the end of the current track we push the next one into
// Liquidsoap's queue ahead of time. Liquidsoap plays queued requests back
// to back with no gap of its own, so pre-loading before the current track
// actually ends is what kills the silence — pushing reactively, only once
// nothing is on air, always cost a few seconds of dead air waiting on this
// poll loop plus the new request's own load time.
const PRELOAD_SECONDS = 15;

function parseFields(raw) {
  const fields = {};
  for (const line of raw.trim().split("\n")) {
    const match = line.match(/^(\w+)="(.*)"$/);
    if (match) fields[match[1]] = match[2];
  }
  return fields;
}

let running = false;

// Keeps the station fed. Two jobs:
//  - reconcile the DB against whatever Liquidsoap is actually doing: drop
//    a 'playing' row once its track has genuinely left the air, and
//    promote a 'cued' row to 'playing' once its track takes over;
//  - once the on-air track is within PRELOAD_SECONDS of ending (or nothing
//    is on air at all), push the next queued track into Liquidsoap right
//    away and mark it 'cued' — it's already loaded and ready, so when the
//    current track ends Liquidsoap moves on to it with no gap.
async function tick() {
  if (running) return;
  running = true;
  try {
    const onAirRaw = await liquidsoap.sendCommand("request.on_air");
    const onAirRid = onAirRaw.trim().split(/\s+/)[0] || null;

    let onAirFilename = null;
    let remaining = null;
    if (onAirRid) {
      const [meta, rem] = await Promise.all([
        liquidsoap.sendCommand(`request.metadata ${onAirRid}`),
        liquidsoap.sendCommand("radio.remaining"),
      ]);
      const fields = parseFields(meta);
      onAirFilename = fields.filename ? path.basename(fields.filename) : null;
      remaining = Number(rem);
    }

    const playing = db.prepare("SELECT * FROM tracks WHERE status = 'playing'").get();
    if (playing && playing.filename !== onAirFilename) {
      db.prepare("DELETE FROM tracks WHERE id = ?").run(playing.id);
    }

    const cued = db.prepare("SELECT * FROM tracks WHERE status = 'cued'").get();
    if (cued && cued.filename === onAirFilename) {
      db.prepare("UPDATE tracks SET status = 'playing' WHERE id = ?").run(cued.id);
    }

    const stillCued = db.prepare("SELECT * FROM tracks WHERE status = 'cued'").get();
    const readyToPreload = !onAirFilename || (remaining !== null && !Number.isNaN(remaining) && remaining <= PRELOAD_SECONDS);
    if (!stillCued && readyToPreload) {
      const next = db
        .prepare("SELECT * FROM tracks WHERE status = 'queued' ORDER BY position ASC LIMIT 1")
        .get();
      if (next) {
        const filePath = path.join(MUSIC_DIR, next.filename);
        await liquidsoap.sendCommand(`queue.push ${filePath}`);
        db.prepare("UPDATE tracks SET status = ? WHERE id = ?").run(onAirFilename ? "cued" : "playing", next.id);
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
