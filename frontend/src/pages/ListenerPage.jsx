import { useEffect, useRef, useState } from "react";
import { usePlayback } from "../hooks/usePlayback";
import { useMessage } from "../hooks/useMessage";
import { STREAM_URL } from "../api";
import PlayButton from "../components/PlayButton.jsx";
import LikeHearts from "../components/LikeHearts.jsx";
import Chat from "../components/Chat.jsx";

// Warms up the DNS/TLS/TCP handshake to the stream host ahead of the first
// click, without ever requesting the stream itself — a <link preconnect>
// doesn't touch the mount, so it can't inflate Icecast's listener count.
function usePreconnect(url) {
  useEffect(() => {
    let origin;
    try {
      origin = new URL(url).origin;
    } catch {
      return;
    }
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = origin;
    document.head.appendChild(link);
    return () => link.remove();
  }, [url]);
}

export default function ListenerPage() {
  const { nowPlaying, status } = usePlayback();
  const message = useMessage();
  // off: nothing playing, volume shown at zero.
  // loading: buffering after a click, before sound is actually audible.
  // on: playing.
  const [soundState, setSoundState] = useState("off");
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef(null);

  usePreconnect(STREAM_URL);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const track = nowPlaying?.current;
  const title = track?.title || track?.album || "";
  const artist = track?.artist || track?.albumartist || track?.album_artist || "";
  const ringTitle = artist ? `${title} — ${artist}` : title;

  const startSound = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setSoundState("loading");
    // Cache-bust so this is always a fresh connection joining live, never
    // a browser-cached response replaying from an old offset.
    audio.src = `${STREAM_URL}${STREAM_URL.includes("?") ? "&" : "?"}_=${Date.now()}`;
    audio.play().catch(() => setSoundState("off"));
  };

  const stopSound = () => {
    const audio = audioRef.current;
    if (!audio) return;
    // A plain pause() leaves the connection to the (infinite, live) stream
    // open in the background, so Icecast keeps counting this client as a
    // listener. Dropping the src and reloading actually closes it, so the
    // count only reflects people with sound on.
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    setSoundState("off");
  };

  const togglePlay = () => {
    if (soundState === "off") startSound();
    else stopSound();
  };

  const handleVolumeChange = (e) => {
    const next = Number(e.target.value);
    setVolume(next);
    if (soundState === "off") startSound();
  };

  const displayedVolume = soundState === "off" ? 0 : volume;

  return (
    <div className="listener">
      <div className="listener__main">
        <div className="listener__brand">
          <span className="listener__brand-text">
            The Stëpa <span className="listener__brand-accent">RADIO</span>
          </span>
        </div>

        <div className="listener__stage">
          <div className="listener__now">
            {ringTitle && <p className="listener__now-title">{ringTitle}</p>}
            {message && <p className="listener__now-message">{message}</p>}
          </div>

          <LikeHearts />
        </div>

        <div className="listener__controls">
          <div className="listener__play-tile">
            <PlayButton state={soundState} onClick={togglePlay} />
          </div>

          <div className="listener__volume-wrap">
            <input
              className="listener__volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={displayedVolume}
              onChange={handleVolumeChange}
              style={{ "--vol": displayedVolume }}
              aria-label="Громкость"
            />
            <span className="listener__volume-value">{Math.round(displayedVolume * 100)}</span>
          </div>

          <div className="listener__listeners">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
              <rect x="2" y="14" width="5" height="7" rx="1.5" />
              <rect x="17" y="14" width="5" height="7" rx="1.5" />
            </svg>
            <span>{status?.listeners ?? 0}</span>
          </div>
        </div>
      </div>

      <Chat />

      <audio
        ref={audioRef}
        preload="none"
        onPlaying={() => setSoundState("on")}
        onError={() => setSoundState("off")}
      />
    </div>
  );
}
