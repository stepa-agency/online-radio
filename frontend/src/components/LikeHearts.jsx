import { useEffect, useRef, useState } from "react";
import { API_BASE, api } from "../api";

let nextId = 0;

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21s-7.5-4.7-10-9.3C.5 8.4 2 5 5.4 5c1.9 0 3.4 1 4.6 2.7C11.2 6 12.7 5 14.6 5 18 5 19.5 8.4 22 11.7 19.5 16.3 12 21 12 21z" />
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
