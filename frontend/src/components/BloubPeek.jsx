import { useEffect, useRef, useState } from "react";
import BloubCharacter, { SHAPES, EXPRESSIONS } from "./BloubCharacter.jsx";

const EDGES = ["top", "right", "bottom", "left"];
const VISIBLE_MS = 5000;
const MIN_GAP_MS = 10000;
const MAX_GAP_MS = 20000;
const GREETING_DELAY_MS = 1500;
const MIN_SIZE = 70;
const MAX_SIZE = 420;

// How far the character sits off-screen at rest, and how far it travels to
// come into view, both scaled to its own size so a tiny appearance and a
// huge one peek in by the same proportion.
const HIDDEN_RATIO = 0.78;
const ENTER_RATIO = 0.72;

function randomEdge(last) {
  const options = EDGES.filter((e) => e !== last);
  return options[Math.floor(Math.random() * options.length)];
}

function randomGap() {
  return MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS);
}

// A fresh spot along the edge every time — clamped a bit so the character
// doesn't spawn dead-center in a corner and clip on both sides.
function randomPosition() {
  return 8 + Math.random() * 84;
}

function randomSize() {
  return MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
}

// Full range, not just a slight tilt — it should genuinely look spun
// around, never reliably upright.
function randomRotation() {
  return -180 + Math.random() * 360;
}

function randomOf(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Pops in from a random screen edge every so often while something's on
// air, sits for a few seconds, then ducks back out — never a permanent
// fixture, and never mid-track for a track change (a fresh song gets a
// quick hello of its own). Shape, expression, size and tilt all re-roll on
// every appearance; only the color stays tied to the track (see
// BloubCharacter).
export default function BloubPeek({ trackKey, onAir }) {
  const [edge, setEdge] = useState("bottom");
  const [position, setPosition] = useState(50);
  const [size, setSize] = useState(220);
  const [rotation, setRotation] = useState(0);
  const [shape, setShape] = useState(SHAPES[0]);
  const [expression, setExpression] = useState(EXPRESSIONS[0]);
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
      setSize(randomSize());
      setRotation(randomRotation());
      setShape(randomOf(SHAPES));
      setExpression(randomOf(EXPRESSIONS));
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

  const style = {
    "--bloub-pos": `${position}%`,
    "--bloub-rot": `${rotation}deg`,
    "--bloub-hidden": `${-Math.round(size * HIDDEN_RATIO)}px`,
    "--bloub-enter": `${Math.round(size * ENTER_RATIO)}px`,
  };

  return (
    <div className={`bloub-peek bloub-peek--${edge}`} data-visible={visible} style={style} aria-hidden="true">
      <BloubCharacter trackKey={trackKey} active={visible} shape={shape} expression={expression} size={size} />
    </div>
  );
}
