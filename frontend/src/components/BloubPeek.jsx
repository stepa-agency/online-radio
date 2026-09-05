import { useEffect, useRef, useState } from "react";
import BloubCharacter from "./BloubCharacter.jsx";

const EDGES = ["top", "right", "bottom", "left"];
const VISIBLE_MS = 5000;
const MIN_GAP_MS = 10000;
const MAX_GAP_MS = 20000;
const GREETING_DELAY_MS = 1500;

function randomEdge(last) {
  const options = EDGES.filter((e) => e !== last);
  return options[Math.floor(Math.random() * options.length)];
}

function randomGap() {
  return MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS);
}

// A fresh spot along the edge every time — clamped a bit so the (now huge)
// character doesn't spawn dead-center in a corner and clip on both sides.
function randomPosition() {
  return 8 + Math.random() * 84;
}

// Pops in from a random screen edge every so often while something's on
// air, sits for a few seconds, then ducks back out — never a permanent
// fixture, and never mid-track for a track change (a fresh song gets a
// quick hello of its own).
export default function BloubPeek({ trackKey, onAir }) {
  const [edge, setEdge] = useState("bottom");
  const [position, setPosition] = useState(50);
  const [visible, setVisible] = useState(false);
  const edgeRef = useRef(edge);
  edgeRef.current = edge;

  useEffect(() => {
    if (!onAir) {
      setVisible(false);
      return;
    }

    let cancelled = false;
    const timeouts = [];

    const peek = () => {
      if (cancelled) return;
      setEdge(randomEdge(edgeRef.current));
      setPosition(randomPosition());
      setVisible(true);
      timeouts.push(setTimeout(hide, VISIBLE_MS));
    };

    const hide = () => {
      if (cancelled) return;
      setVisible(false);
      timeouts.push(setTimeout(peek, randomGap()));
    };

    timeouts.push(setTimeout(peek, GREETING_DELAY_MS));

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [onAir, trackKey]);

  return (
    <div
      className={`bloub-peek bloub-peek--${edge}`}
      data-visible={visible}
      style={{ "--bloub-pos": `${position}%` }}
      aria-hidden="true"
    >
      <BloubCharacter trackKey={trackKey} active={visible} size={320} />
    </div>
  );
}
