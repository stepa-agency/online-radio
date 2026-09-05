import { useEffect, useRef, useState } from "react";
import { usePlayback } from "../hooks/usePlayback";
import { useMessage } from "../hooks/useMessage";
import { STREAM_URL } from "../api";

export default function ListenerPage() {
  const { nowPlaying } = usePlayback();
  const message = useMessage();
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const track = nowPlaying?.current;
  const title = track?.title || track?.album || "";
  const artist = track?.artist || track?.albumartist || track?.album_artist || "";

  const toggleSound = () => {
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
    <div className="listener">
      <div className="listener__top">
        {title && <p className="listener__title">{title}</p>}
        {artist && <p className="listener__artist">{artist}</p>}
      </div>

      <p className="listener__message">{message}</p>

      <div className="listener__controls">
        <button className="listener__sound-btn" onClick={toggleSound}>
          {playing ? "Выключить звук" : "Включить звук"}
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

      <audio ref={audioRef} src={STREAM_URL} preload="none" />
    </div>
  );
}
