import { usePlayback } from "../hooks/usePlayback";
import NowPlaying from "../components/NowPlaying.jsx";

export default function ListenerPage() {
  const { nowPlaying, status } = usePlayback();

  return (
    <div className="app app--listener">
      <header className="app__header">
        <div className="logo">
          <span className="bullet" />
          <span className="logo__text">Online Radio</span>
          <span className="bullet" />
        </div>
      </header>

      <main className="app__main">
        <NowPlaying nowPlaying={nowPlaying} status={status} />
      </main>
    </div>
  );
}
