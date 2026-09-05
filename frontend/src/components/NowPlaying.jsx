import { useEffect, useRef, useState } from "react";
import { STREAM_URL } from "../api";

function formatTime(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return "--:--";
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  // Podcasts and audiobook chapters can run for hours — fall back to
  // H:MM:SS instead of letting the minutes climb past 59.
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  return `${m}:${String(rem).padStart(2, "0")}`;
}

export default function NowPlaying({ nowPlaying, status, onSkip, skipping }) {
  const [remaining, setRemaining] = useState(null);
  const [duration, setDuration] = useState(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const track = nowPlaying?.current;
  const onAir = Boolean(track);

  useEffect(() => {
    setRemaining(nowPlaying?.remainingSeconds ?? null);
    if (track?.on_air_timestamp && nowPlaying?.remainingSeconds != null) {
      const startedMs = parseFloat(track.on_air_timestamp) * 1000;
      const elapsed = (Date.now() - startedMs) / 1000;
      setDuration(Math.max(elapsed + nowPlaying.remainingSeconds, 1));
    } else {
      setDuration(null);
    }
    // Only resync when the server actually reports fresh numbers — not on
    // every local tick of `remaining` below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowPlaying?.remainingSeconds, track?.rid]);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((prev) => (prev == null ? prev : Math.max(0, prev - 1)));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const title = track?.title || track?.album || "";
  const artist = track?.artist || track?.albumartist || track?.album_artist || "";
  const progress =
    duration && remaining != null ? Math.min(100, Math.max(0, ((duration - remaining) / duration) * 100)) : 0;

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <section className="now-playing">
      <div className="now-playing__status">
        <span className={`live-dot ${status?.live ? "live-dot--on" : ""}`} />
        <span className="label">{status?.live ? "Стрим включён" : "Стрим оффлайн"}</span>
        <span className="now-playing__listeners">{status?.listeners ?? 0} слушают</span>
      </div>

      {onAir ? (
        <>
          <div className="now-playing__track">
            <span className="now-playing__on-air-tag">
              <span className="live-dot live-dot--on" />
              В эфире
            </span>
            <h1 className="now-playing__title">{title}</h1>
            {artist && <p className="now-playing__artist">{artist}</p>}
          </div>

          <div className="now-playing__progress">
            <div className="now-playing__progress-bar">
              <div className="now-playing__progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="now-playing__time">{formatTime(remaining)}</span>
          </div>
        </>
      ) : (
        <div className="now-playing__idle">
          <p className="now-playing__idle-title">Эфир пуст</p>
          <p className="now-playing__idle-hint">Добавь трек в очередь справа — он включится сам.</p>
        </div>
      )}

      <div className="now-playing__controls">
        <button className="pill pill--ghost" onClick={togglePlayback}>
          {playing ? "Пауза" : "Слушать"}
        </button>
        {onSkip && (
          <button className="pill pill--solid" onClick={onSkip} disabled={skipping || !onAir}>
            {skipping ? "..." : "Skip →"}
          </button>
        )}
      </div>

      <audio ref={audioRef} src={STREAM_URL} preload="none" />
    </section>
  );
}
