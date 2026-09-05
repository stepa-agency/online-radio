const express = require("express");
const cors = require("cors");
const db = require("./db");
const tracksRouter = require("./routes/tracks");
const controlRouter = require("./routes/control");
const messageRouter = require("./routes/message");
const { startAutoAdvance } = require("./autoAdvance");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/tracks", tracksRouter);
app.use("/api", controlRouter);
app.use("/api", messageRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
const autoAdvanceTimer = startAutoAdvance();

function shutdown() {
  clearInterval(autoAdvanceTimer);
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
