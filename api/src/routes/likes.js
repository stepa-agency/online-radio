const express = require("express");

const router = express.Router();

// Anonymous, ephemeral, fire-and-forget: a like is just a signal to
// broadcast to everyone currently connected, not a record worth persisting.
const clients = new Set();

// Measured empirically: the Cloudflare quick tunnel in front of this holds
// data in fixed ~128KB frames and only releases a frame once it's full —
// a small write (a ping, one heart event) can sit forever in a
// half-filled frame. Padding every real write past a full frame forces
// that frame out immediately, carrying the real payload with it.
const FRAME = 128 * 1024;
const PAD = `:${" ".repeat(FRAME + 1024)}\n\n`;

router.get("/likes/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write(PAD);
  clients.add(res);

  // Quick tunnels have been seen dropping idle long-lived connections —
  // a periodic write keeps this one alive end to end (it doesn't need to
  // reach the client promptly the way a real event does).
  const heartbeat = setInterval(() => res.write(": ping\n\n"), 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
});

router.post("/likes", (req, res) => {
  for (const client of clients) {
    client.write(`event: heart\ndata: {}\n\n${PAD}`);
  }
  res.status(204).end();
});

module.exports = router;
