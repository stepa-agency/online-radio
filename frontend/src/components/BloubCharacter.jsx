import { useEffect, useRef } from "react";
import "../vendor/bloub/register.js";

// IDs read straight out of the vendored bot/skins.ts and bot/expressions.ts —
// they're not arbitrary strings, defineCustomElement rejects anything else.
const SHAPES = ["cercle", "galet", "squircle", "capsule", "triangle", "hexagone", "nuage", "goutte"];
const COLORS = [
  "encre",
  "brun",
  "rouge",
  "orange",
  "ambre",
  "vert",
  "turquoise",
  "bleu",
  "violet",
  "rose",
  "gris",
  "creme",
];
const EXPRESSIONS = [
  "neutre",
  "attentif",
  "surpris",
  "excite",
  "heureux",
  "hilare",
  "colere",
  "triste",
  "effraye",
  "mefiant",
  "confus",
  "curieux",
  "fier",
  "timide",
  "blase",
  "somnolent",
];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pick(list, seed, salt) {
  return list[hash(`${seed}:${salt}`) % list.length];
}

// One track -> one consistent look, so the same song always comes back as
// the same little guy instead of re-rolling on every poll.
export default function BloubCharacter({ trackKey, active, size = 220 }) {
  const elRef = useRef(null);
  const seed = trackKey || "silence";

  const shape = pick(SHAPES, seed, "shape");
  const color = pick(COLORS, seed, "color");
  const expression = pick(EXPRESSIONS, seed, "expression");

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    el.shape = shape;
    el.color = color;
    el.expression = expression;
  }, [shape, color, expression]);

  // 'idle' and 'swirl' are the only two of bloub's 14 states with a real
  // face (baseFace: true) — the rest turn the body into an object (a "!",
  // an egg, a burst of dots, a comet...), which is exactly what we don't
  // want. So every appearance is just a one-off swirl-then-settle, never
  // the built-in demo reel (which cycles through all 14).
  useEffect(() => {
    const el = elRef.current;
    if (!el || !active) return;
    el.state = "swirl";
    const t = setTimeout(() => {
      el.state = "idle";
    }, 1400);
    return () => clearTimeout(t);
  }, [active]);

  return <bloub-bot ref={elRef} size={size} paper="#ffffff" />;
}
