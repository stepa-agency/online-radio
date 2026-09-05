#!/usr/bin/liquidsoap

settings.log.stdout.set(true)
settings.log.level.set(3)

# Telnet server: exposes commands to control the running radio.
# Test it with: telnet localhost 1234  (or `nc localhost 1234`)
settings.server.telnet.set(true)
settings.server.telnet.bind_addr.set("0.0.0.0")
settings.server.telnet.port.set(1234)

icecast_password = environment.get(default="hackme", "ICECAST_SOURCE_PASSWORD")

# --- Source --------------------------------------------------------------

# The ONLY thing that ever plays: tracks explicitly pushed here (the app's
# "Play next" button, or directly over telnet). No background rotation over
# /music — a file sitting in that folder never plays on its own, so nothing
# unqueued ever ends up on air.
#   telnet> queue.push /music/some-track.mp3
queue = request.queue(id="queue")

# Silence instead of crashing when the queue runs dry.
radio = mksafe(queue)

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
