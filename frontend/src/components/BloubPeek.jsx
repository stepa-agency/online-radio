import { useEffect, useRef, useState } from "react";
import BloubCharacter, { SHAPES, EXPRESSIONS } from "./BloubCharacter.jsx";

const EDGES = ["top", "right", "bottom", "left"];
const VISIBLE_MS = 5000;
const MIN_GAP_MS = 10000;
const MAX_GAP_MS = 20000;
const GREETING_DELAY_MS = 1500;
const RELOCATE_MS = 350;

// How far off-screen it sits at rest, as a multiple of its own size. A
// rotated square's farthest corner is size*sqrt(2)/2 from center (worst
// case at 45/135/225/315deg) — going past that plus a buffer guarantees no
// corner ever hangs over the edge while it's supposed to be hidden.
const HIDDEN_RATIO = Math.SQRT2 / 2 + 0.12;
// How much of that distance it travels back on entry — leaves a small
// amount tucked behind the edge, like it's peeking out rather than
// floating free on screen.
const ENTER_RATIO = HIDDEN_RATIO - 0.12;

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

// Mostly medium, occasionally tiny, rarely (but genuinely) enormous — up to
// a third of the screen's shorter side.
function randomSize() {
  const roll = Math.random();
  if (roll < 0.15) return 50 + Math.random() * 55; // tiny: rare
  if (roll < 0.85) return 140 + Math.random() * 190; // medium: most common
  const giantMax = Math.max(360, Math.min(window.innerWidth, window.innerHeight) / 3);
  return 340 + Math.random() * Math.max(40, giantMax - 340); // giant: occasional
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
// BloubCharacter). Click sends it away and back somewhere new; hover makes
// it bigger for as long as the pointer's over it.
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
  const timeoutRef = useRef(null);

  const appear = () => {
    setEdge(randomEdge(edgeRef.current));
    setPosition(randomPosition());
    setSize(randomSize());
    setRotation(randomRotation());
    setShape(randomOf(SHAPES));
    setExpression(randomOf(EXPRESSIONS));
    setVisible(true);
    timeoutRef.current = setTimeout(retreat, VISIBLE_MS);
  };

  const retreat = () => {
    setVisible(false);
    timeoutRef.current = setTimeout(appear, randomGap());
  };

  useEffect(() => {
    if (!onAir) {
      clearTimeout(timeoutRef.current);
      setVisible(false);
      return;
    }

    timeoutRef.current = setTimeout(appear, GREETING_DELAY_MS);

    return () => {
      clearTimeout(timeoutRef.current);
    };
    // appear/retreat close over state setters only (stable) and edgeRef
    // (always current) — safe to omit from deps, and listing them would
    // re-fire this effect (and restart the cycle) on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onAir, trackKey]);

  const handleClick = () => {
    if (!visible) return;
    clearTimeout(timeoutRef.current);
    setVisible(false);
    timeoutRef.current = setTimeout(appear, RELOCATE_MS);
  };

  const style = {
    "--bloub-pos": `${position}%`,
    "--bloub-rot": `${rotation}deg`,
    "--bloub-hidden": `${-Math.round(size * HIDDEN_RATIO)}px`,
    "--bloub-enter": `${Math.round(size * ENTER_RATIO)}px`,
  };

  return (
    <div
      className={`bloub-peek bloub-peek--${edge}`}
      data-visible={visible}
      style={style}
      onClick={handleClick}
      aria-hidden="true"
    >
      <BloubCharacter trackKey={trackKey} active={visible} shape={shape} expression={expression} size={size} />
    </div>
  );
}
