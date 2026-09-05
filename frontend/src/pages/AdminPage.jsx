import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { usePlayback } from "../hooks/usePlayback";
import NowPlaying from "../components/NowPlaying.jsx";
import Queue from "../components/Queue.jsx";
import UploadForm from "../components/UploadForm.jsx";

export default function AdminPage() {
  const { nowPlaying, status, skip, skipping, refresh } = usePlayback();
  const [tracks, setTracks] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const refreshTracks = useCallback(() => {
    api.getTracks().then(setTracks).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    refreshTracks();
  }, [refreshTracks]);

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
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleSkip = async () => {
    try {
      await skip();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app">
      <header className="app__header app__header--admin">
        <div className="logo">
          <span className="bullet" />
          <span className="logo__text">Online Radio</span>
          <span className="bullet" />
        </div>
        <div className="app__header-right">
          <span className="badge badge--admin">Админка</span>
          <Link className="app__public-link" to="/">
            Страница слушателя →
          </Link>
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
