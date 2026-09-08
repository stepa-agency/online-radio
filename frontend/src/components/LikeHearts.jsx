import { useEffect, useRef, useState } from "react";
import { API_BASE, api } from "../api";

const CORNERS = ["tl", "tr", "bl", "br"];
let nextId = 0;

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21s-7.5-4.7-10-9.3C.5 8.4 2 5 5.4 5c1.9 0 3.4 1 4.6 2.7C11.2 6 12.7 5 14.6 5 18 5 19.5 8.4 22 11.7 19.5 16.3 12 21 12 21z" />
    </svg>
  );
}

// A burst of small hearts drifting in from a random screen corner, visible
// to every open tab — the click itself only posts a signal; the animation
// is driven entirely by what comes back over the shared SSE stream, so the
// person who clicked sees exactly the same thing everyone else does.
function spawnBurst(setParticles) {
  const count = 2 + Math.floor(Math.random() * 2);
  const made = Array.from({ length: count }, () => {
    const corner = CORNERS[Math.floor(Math.random() * CORNERS.length)];
    const spreadX = 40 + Math.random() * 60;
    const spreadY = 120 + Math.random() * 160;
    const signX = corner.endsWith("l") ? 1 : -1;
    const signY = corner.startsWith("t") ? 1 : -1;
    return {
      id: nextId++,
      corner,
      dx: signX * spreadX,
      dy: signY * spreadY,
      duration: 2.2 + Math.random() * 1.2,
      delay: Math.random() * 0.35,
      drift: (Math.random() - 0.5) * 40,
    };
  });
  setParticles((prev) => [...prev, ...made]);
}

export default function LikeHearts() {
  const [particles, setParticles] = useState([]);
  const setParticlesRef = useRef(setParticles);
  setParticlesRef.current = setParticles;

  useEffect(() => {
    const source = new EventSource(`${API_BASE}/api/likes/stream`);
    source.addEventListener("heart", () => spawnBurst(setParticlesRef.current));
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
            className={`heart-particle heart-particle--${p.corner}`}
            style={{
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              "--drift": `${p.drift}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
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
