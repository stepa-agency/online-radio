import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import NowPlaying from "./components/NowPlaying.jsx";
import Queue from "./components/Queue.jsx";
import UploadForm from "./components/UploadForm.jsx";

export default function App() {
  const [tracks, setTracks] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [status, setStatus] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [skipping, setSkipping] = useState(false);
  const [error, setError] = useState(null);

  const refreshTracks = useCallback(() => {
    api.getTracks().then(setTracks).catch((err) => setError(err.message));
  }, []);

  const refreshPlayback = useCallback(() => {
    Promise.all([api.nowPlaying(), api.status()])
      .then(([np, st]) => {
        setNowPlaying(np);
        setStatus(st);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshTracks();
    refreshPlayback();
    const id = setInterval(refreshPlayback, 5000);
    return () => clearInterval(id);
  }, [refreshTracks, refreshPlayback]);

  const handleUpload = async (formData) => {
    await api.uploadTrack(formData);
    refreshTracks();
  };

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      await api.deleteTrack(id);
      refreshTracks();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handlePlayNext = async (id) => {
    setBusyId(id);
    try {
      await api.playNext(id);
      refreshPlayback();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleSkip = async () => {
    setSkipping(true);
    try {
      await api.skip();
      setTimeout(refreshPlayback, 500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSkipping(false);
    }
  };

  return (
    <div className="app">
      <header className="app__header">
        <div className="logo">
          <span className="bullet" />
          <span className="logo__text">Online Radio</span>
          <span className="bullet" />
        </div>
      </header>

      <main className="app__main">
        <NowPlaying nowPlaying={nowPlaying} status={status} onSkip={handleSkip} skipping={skipping} />

        <div className="app__grid">
          <Queue tracks={tracks} onPlayNext={handlePlayNext} onDelete={handleDelete} busyId={busyId} />
          <UploadForm onUpload={handleUpload} />
        </div>
      </main>

      {error && (
        <div className="toast" onClick={() => setError(null)}>
          {error}
        </div>
      )}
    </div>
  );
}
