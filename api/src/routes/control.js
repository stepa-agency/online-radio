const express = require("express");
const liquidsoap = require("../liquidsoap");

const router = express.Router();

router.post("/skip", async (req, res) => {
  try {
    const result = await liquidsoap.sendCommand("radio.skip");
    res.json({ ok: true, result });
  } catch (err) {
    res.status(502).json({ error: `Liquidsoap error: ${err.message}` });
  }
});

router.get("/now-playing", async (req, res) => {
  try {
    const metadata = await liquidsoap.sendCommand("radio.metadata");
    const remaining = await liquidsoap.sendCommand("radio.remaining");
    res.json({ metadata, remainingSeconds: Number(remaining) || null });
  } catch (err) {
    res.status(502).json({ error: `Liquidsoap error: ${err.message}` });
  }
});

module.exports = router;
