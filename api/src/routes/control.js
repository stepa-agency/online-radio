const express = require("express");
const liquidsoap = require("../liquidsoap");

const ICECAST_STATUS_URL =
  process.env.ICECAST_STATUS_URL || "http://icecast:8000/status-json.xsl";

const router = express.Router();

router.post("/skip", async (req, res) => {
  try {
    const result = await liquidsoap.sendCommand("radio.skip");
    res.json({ ok: true, result });
  } catch (err) {
    res.status(502).json({ error: `Liquidsoap error: ${err.message}` });
  }
});

function parseFields(raw) {
  const fields = {};
  for (const line of raw.trim().split("\n")) {
    const match = line.match(/^(\w+)="(.*)"$/);
    if (match) fields[match[1]] = match[2];
  }
  return fields;
}

router.get("/now-playing", async (req, res) => {
  try {
    const onAir = await liquidsoap.sendCommand("request.on_air");
    const rid = onAir.split(/\s+/)[0];
    if (!rid) {
      return res.json({ current: null, remainingSeconds: null });
    }

    const [rawMetadata, remaining] = await Promise.all([
      liquidsoap.sendCommand(`request.metadata ${rid}`),
      liquidsoap.sendCommand("radio.remaining"),
    ]);
    res.json({
      current: parseFields(rawMetadata),
      remainingSeconds: Number(remaining) || null,
    });
  } catch (err) {
    res.status(502).json({ error: `Liquidsoap error: ${err.message}` });
  }
});

router.get("/status", async (req, res) => {
  try {
    const response = await fetch(ICECAST_STATUS_URL);
    const data = await response.json();
    const source = data?.icestats?.source;
    res.json({ live: Boolean(source), listeners: source?.listeners ?? 0 });
  } catch (err) {
    res.json({ live: false, listeners: 0 });
  }
});

module.exports = router;
