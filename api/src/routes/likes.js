const express = require("express");

const router = express.Router();

// Anonymous, ephemeral, fire-and-forget: a like is just a signal to
// broadcast to everyone currently connected, not a record worth persisting.
const clients = new Set();

router.get("/likes/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("\n");
  clients.add(res);

  // Quick tunnels have been seen dropping idle long-lived connections —
  // a periodic comment line keeps this one visibly alive end to end.
  const heartbeat = setInterval(() => res.write(": ping\n\n"), 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
});

router.post("/likes", (req, res) => {
  for (const client of clients) {
    client.write("event: heart\ndata: {}\n\n");
  }
  res.status(204).end();
});

module.exports = router;
