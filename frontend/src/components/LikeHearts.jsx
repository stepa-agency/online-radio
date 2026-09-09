import { useEffect, useId, useRef, useState } from "react";
import { API_BASE, api } from "../api";

let nextId = 0;

// A rounder, fuller heart than the last one (which read as clipped at
// small sizes) plus a gradient fill and a glossy highlight for some
// actual depth — this is the "like" button, it should feel satisfying to
// mash. useId keeps the gradient's id unique so multiple hearts on screen
// at once (the button plus however many particles are mid-flight) don't
// collide on the same DOM id.
function HeartIcon() {
  const gradId = useId();
  return (
    <svg viewBox="0 0 24 24">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0.15" y2="1">
          <stop offset="0%" stopColor="#ffab6e" />
          <stop offset="55%" stopColor="#ff590c" />
          <stop offset="100%" stopColor="#e6390a" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradId})`}
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
      <ellipse cx="7.6" cy="7.4" rx="2.3" ry="1.3" fill="rgba(255,255,255,0.4)" transform="rotate(-40 7.6 7.4)" />
    </svg>
  );
}

// One heart per like, rising from a random spot along the bottom edge —
// visible to every open tab. The click itself only posts a signal; the
// animation is driven entirely by what comes back over the shared SSE
// stream, so the person who clicked sees exactly the same thing everyone
// else does.
function spawnHeart(setParticles) {
  const particle = {
    id: nextId++,
    left: 6 + Math.random() * 88,
    rise: 55 + Math.random() * 25,
    drift: (Math.random() - 0.5) * 90,
    duration: 2.6 + Math.random() * 0.8,
    rotate: (Math.random() - 0.5) * 50,
  };
  setParticles((prev) => [...prev, particle]);
}

export default function LikeHearts() {
  const [particles, setParticles] = useState([]);
  const setParticlesRef = useRef(setParticles);
  setParticlesRef.current = setParticles;

  useEffect(() => {
    const source = new EventSource(`${API_BASE}/api/likes/stream`);
    source.addEventListener("heart", () => spawnHeart(setParticlesRef.current));
    return () => source.close();
  }, []);

  const remove = (id) => setParticles((prev) => prev.filter((p) => p.id !== id));

  const handleLike = () => {
    api.like().catch(() => {});
  };

  return (
    <>
      <button className="heart-btn" onClick={handleLike} aria-label="Лайк">
        <HeartIcon />
      </button>
      <div className="hearts-overlay">
        {particles.map((p) => (
          <span
            key={p.id}
            className="heart-particle"
            style={{
              left: `${p.left}%`,
              "--rise": `${p.rise}vh`,
              "--drift": `${p.drift}px`,
              "--rotate": `${p.rotate}deg`,
              animationDuration: `${p.duration}s`,
            }}
            onAnimationEnd={() => remove(p.id)}
          >
            <HeartIcon />
          </span>
        ))}
      </div>
    </>
  );
}
