const SIZE = 440;
const CENTER = SIZE / 2;
const INNER_RADIUS = 100;
const OUTER_RADIUS = 175;
const SEPARATOR = "   •   ";
const PX_PER_SECOND = 90;

// A full circle, traced as two semicircle arcs (a single <path> can't do a
// full 360° sweep).
function circlePath(r) {
  return `M ${CENTER + r} ${CENTER} A ${r} ${r} 0 1 1 ${CENTER - r} ${CENTER} A ${r} ${r} 0 1 1 ${CENTER + r} ${CENTER}`;
}

// Animating textPath's startOffset around a closed loop doesn't scroll
// seamlessly — content past 100% simply isn't rendered, so the ring
// visually "fills up" from empty and then snaps back at each repeat.
// Instead the text sits fixed on the path (tiled densely enough to cover
// the whole circle) and the entire group spins around the shared center —
// a fully-covered ring looks identical at any rotation angle, so this has
// no seam to hide.
function RingText({ text, pathId, radius, className, reverse }) {
  if (!text) return null;

  const circumference = 2 * Math.PI * radius;
  const tile = text + SEPARATOR;
  // Character width can't be measured before the first paint, so this
  // errs generously low on assumed width — a few extra copies cost
  // nothing on a short decorative string, but too few leave visible gaps.
  const repeats = Math.max(6, Math.ceil((circumference * 2.5) / (tile.length * 6)));
  const content = tile.repeat(repeats);
  const duration = circumference / PX_PER_SECOND;
  const from = reverse ? `360 ${CENTER} ${CENTER}` : `0 ${CENTER} ${CENTER}`;
  const to = reverse ? `0 ${CENTER} ${CENTER}` : `360 ${CENTER} ${CENTER}`;

  return (
    <g key={text}>
      <text className={className}>
        <textPath href={`#${pathId}`} xlinkHref={`#${pathId}`} startOffset="0%">
          {content}
        </textPath>
      </text>
      <animateTransform
        attributeName="transform"
        type="rotate"
        from={from}
        to={to}
        dur={`${duration}s`}
        repeatCount="indefinite"
      />
    </g>
  );
}

export default function TrackRing({ title, message }) {
  return (
    <svg className="ring" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
      <defs>
        <path id="ring-title-path" d={circlePath(INNER_RADIUS)} fill="none" />
        <path id="ring-message-path" d={circlePath(OUTER_RADIUS)} fill="none" />
      </defs>
      <RingText text={title} pathId="ring-title-path" radius={INNER_RADIUS} className="ring__title" />
      <RingText text={message} pathId="ring-message-path" radius={OUTER_RADIUS} className="ring__message" reverse />
    </svg>
  );
}
