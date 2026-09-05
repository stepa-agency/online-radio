import { useEffect, useRef, useState } from "react";
import { STREAM_URL } from "../api";

function formatTime(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return "--:--";
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, "0")}`;
}

export default function NowPlaying({ nowPlaying, status, onSkip, skipping }) {
  const [remaining, setRemaining] = useState(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    setRemaining(nowPlaying?.remainingSeconds ?? null);
  }, [nowPlaying?.remainingSeconds]);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((prev) => (prev == null ? prev : Math.max(0, prev - 1)));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const track = nowPlaying?.current;
  const title = track?.title || track?.album || "Без названия";
  const artist = track?.artist || track?.albumartist || track?.album_artist || "Неизвестный исполнитель";

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
        <span className="label">{status?.live ? "В эфире" : "Оффлайн"}</span>
        <span className="now-playing__listeners">{status?.listeners ?? 0} слушают</span>
      </div>

      <div className="now-playing__track">
        <p className="label">Сейчас играет</p>
        <h1 className="now-playing__title">{title}</h1>
        <p className="now-playing__artist">{artist}</p>
      </div>

      <div className="now-playing__controls">
        <button className="pill pill--ghost" onClick={togglePlayback}>
          {playing ? "Пауза" : "Слушать"}
        </button>
        <span className="now-playing__time">{formatTime(remaining)}</span>
        <button className="pill pill--solid" onClick={onSkip} disabled={skipping}>
          {skipping ? "..." : "Skip →"}
        </button>
      </div>

      <audio ref={audioRef} src={STREAM_URL} preload="none" />
    </section>
  );
}
