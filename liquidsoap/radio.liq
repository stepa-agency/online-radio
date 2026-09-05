#!/usr/bin/liquidsoap

settings.log.stdout.set(true)
settings.log.level.set(3)

# Telnet server: exposes commands to control the running radio.
# Test it with: telnet localhost 1234  (or `nc localhost 1234`)
settings.server.telnet.set(true)
settings.server.telnet.bind_addr.set("0.0.0.0")
settings.server.telnet.port.set(1234)

icecast_password = environment.get(default="hackme", "ICECAST_SOURCE_PASSWORD")

# --- Sources -----------------------------------------------------------

# Priority queue: tracks pushed at runtime via telnet play first.
#   telnet> queue.push /music/some-track.mp3
queue = request.queue(id="queue")

# Background rotation: everything currently sitting in /music.
# reload_mode="watch" makes it pick up new/removed files immediately,
# so the Node.js API can just drop files into /music.
#   telnet> music.skip     -> force the playlist to move on
#   telnet> music.reload   -> force a manual rescan of the folder
music = playlist(id="music", mode="normal", reload_mode="watch", "/music")

# Queued requests take priority over the background rotation; whichever
# is currently playing advances to the next track automatically.
radio = fallback(track_sensitive=false, [queue, music])

# Never let the stream die: fall back to silence instead of crashing if
# both the queue and the music folder are empty.
radio = mksafe(radio)

# --- Output --------------------------------------------------------------

# id="radio" is what makes the skip command below "radio.skip" — without an
# explicit id, Liquidsoap derives one from `name`, which is less predictable.
#   telnet> radio.skip     -> skip whatever is currently playing
output.icecast(
  %mp3(bitrate=128),
  id="radio",
  host="icecast",
  port=8000,
  password=icecast_password,
  mount="stream",
  name="Online Radio",
  description="Auto-DJ stream",
  radio
)
