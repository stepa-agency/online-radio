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
export default function BloubCharacter({ trackKey, playing, size = 220 }) {
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

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    el.playing = Boolean(playing);
  }, [playing]);

  return <bloub-bot ref={elRef} size={size} paper="#ffffff" />;
}
