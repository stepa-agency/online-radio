import { useEffect, useRef, useState } from "react";
import { usePlayback } from "../hooks/usePlayback";
import { useMessage } from "../hooks/useMessage";
import { STREAM_URL } from "../api";
import SoundIcon from "../components/SoundIcon.jsx";
import BloubPeek from "../components/BloubPeek.jsx";
import ListenerCount from "../components/ListenerCount.jsx";

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
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef(null);

  usePreconnect(STREAM_URL);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const track = nowPlaying?.current;
  const title = track?.title || track?.album || "";
  const artist = track?.artist || track?.albumartist || track?.album_artist || "";
  const trackKey = track?.rid || track?.filename || title;

  const toggleSound = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      // A plain pause() leaves the connection to the (infinite, live)
      // stream open in the background, so Icecast keeps counting this
      // client as a listener. Dropping the src and reloading actually
      // closes it, so the count only reflects people with sound on.
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      setPlaying(false);
    } else {
      // Cache-bust so this is always a fresh connection joining live,
      // never a browser-cached response replaying from an old offset.
      audio.src = `${STREAM_URL}${STREAM_URL.includes("?") ? "&" : "?"}_=${Date.now()}`;
      audio.play();
      setPlaying(true);
    }
  };

  return (
    <div className="listener">
      <BloubPeek trackKey={trackKey} onAir={Boolean(track)} />
      <ListenerCount count={status?.listeners} />

      <div className="listener__content">
        <div className="listener__brand">
          <span className="bullet" />
          <span className="listener__brand-text">The Radio</span>
          <span className="bullet" />
        </div>

        <div className="listener__top">
          {title && <p className="listener__title">{title}</p>}
          {artist && <p className="listener__artist">{artist}</p>}
        </div>

        <div className="listener__message-wrap">
          <p className="listener__message">{message}</p>
        </div>

        <div className="listener__controls">
          <button className="listener__sound-btn" onClick={toggleSound}>
            <SoundIcon on={playing} />
            <span>{playing ? "OFF" : "ON"}</span>
          </button>
          <input
            className="listener__volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Громкость"
          />
        </div>
      </div>

      <audio ref={audioRef} preload="none" />
    </div>
  );
}
