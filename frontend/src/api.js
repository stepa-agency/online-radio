const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";
export const STREAM_URL = import.meta.env.VITE_STREAM_URL || "http://localhost:8000/stream";

async function request(path, options) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getTracks: () => request("/api/tracks"),
  uploadTrack: (formData) => request("/api/tracks", { method: "POST", body: formData }),
  deleteTrack: (id) => request(`/api/tracks/${id}`, { method: "DELETE" }),
  playNext: (id) => request(`/api/tracks/${id}/play-next`, { method: "POST" }),
  skip: () => request("/api/skip", { method: "POST" }),
  nowPlaying: () => request("/api/now-playing"),
  status: () => request("/api/status"),
};
