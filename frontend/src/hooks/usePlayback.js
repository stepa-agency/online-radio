import { useCallback, useEffect, useState } from "react";
import { api } from "../api";

export function usePlayback() {
  const [nowPlaying, setNowPlaying] = useState(null);
  const [status, setStatus] = useState(null);
  const [skipping, setSkipping] = useState(false);

  const refresh = useCallback(() => {
    Promise.all([api.nowPlaying(), api.status()])
      .then(([np, st]) => {
        setNowPlaying(np);
        setStatus(st);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  const skip = async () => {
    setSkipping(true);
    try {
      await api.skip();
      setTimeout(refresh, 500);
    } finally {
      setSkipping(false);
    }
  };

  return { nowPlaying, status, skip, skipping, refresh };
}
