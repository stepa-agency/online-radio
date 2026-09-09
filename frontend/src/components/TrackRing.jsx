const SIZE = 440;
const CENTER = SIZE / 2;
// Message on the inner ring, track title on the outer one — swapped from
// the original layout per feedback.
const MESSAGE_RADIUS = 100;
const TITLE_RADIUS = 175;
const PX_PER_SECOND = 90;

// A full circle, traced as two semicircle arcs (a single <path> can't do a
// full 360° sweep).
function circlePath(r) {
  return `M ${CENTER + r} ${CENTER} A ${r} ${r} 0 1 1 ${CENTER - r} ${CENTER} A ${r} ${r} 0 1 1 ${CENTER + r} ${CENTER}`;
}

// The text sits on the path exactly once (no tiled repeats) and the whole
// group spins continuously around the shared center. Both rings spin the
// same direction — the outer one, with a longer circumference, takes
// proportionally longer per lap at the same edge speed, so the two read as
// clearly different speeds without needing a separate multiplier.
function RingText({ text, pathId, radius, className }) {
  if (!text) return null;

  const circumference = 2 * Math.PI * radius;
  const duration = circumference / PX_PER_SECOND;

  return (
    <g key={text}>
      <text className={className}>
        <textPath href={`#${pathId}`} xlinkHref={`#${pathId}`} startOffset="0%">
          {text}
        </textPath>
      </text>
      <animateTransform
        attributeName="transform"
        type="rotate"
        from={`0 ${CENTER} ${CENTER}`}
        to={`360 ${CENTER} ${CENTER}`}
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
        <path id="ring-message-path" d={circlePath(MESSAGE_RADIUS)} fill="none" />
        <path id="ring-title-path" d={circlePath(TITLE_RADIUS)} fill="none" />
      </defs>
      <RingText text={message} pathId="ring-message-path" radius={MESSAGE_RADIUS} className="ring__message" />
      <RingText text={title} pathId="ring-title-path" radius={TITLE_RADIUS} className="ring__title" />
    </svg>
  );
}
