#!/usr/bin/liquidsoap

settings.log.stdout.set(true)
settings.log.level.set(3)

# Telnet server: exposes commands to control the running radio.
# Test it with: telnet localhost 1234  (or `nc localhost 1234`)
settings.server.telnet.set(true)
settings.server.telnet.bind_addr.set("0.0.0.0")
settings.server.telnet.port.set(1234)

icecast_password = getenv("ICECAST_SOURCE_PASSWORD")

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
#   telnet> radio.skip     -> skip whatever is currently playing
radio = fallback(id="radio", track_sensitive=false, [queue, music])

# Never let the stream die: fall back to silence instead of crashing if
# both the queue and the music folder are empty.
radio = mksafe(radio)

# --- Output --------------------------------------------------------------

output.icecast(
  %mp3(bitrate=128),
  host="icecast",
  port=8000,
  password=icecast_password,
  mount="stream",
  name="Online Radio",
  description="Auto-DJ stream",
  radio
)
