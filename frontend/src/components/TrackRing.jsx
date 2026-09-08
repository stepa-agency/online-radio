import { useEffect, useRef, useState } from "react";

// How many copies of "text + separator" get tiled into the textPath. The
// loop only needs to jump back by the length of one tile once it's off
// screen at the far end — three keeps the path comfortably covered for
// both short and long titles without measuring against the arc itself.
const TILE_COUNT = 3;
const SEPARATOR = "   •   ";
const PX_PER_SECOND = 34;

function RingText({ text, pathId, className }) {
  const pathRef = useRef(null);
  const [tileLength, setTileLength] = useState(0);

  useEffect(() => {
    setTileLength(0);
    if (!pathRef.current || !text) return;
    // The tiled string is already in the DOM by the time this runs, so one
    // measurement gives the exact length of a single tile — and because
    // every tile is identical, looping the scroll by exactly that distance
    // is seamless regardless of how long the actual title/message is.
    const id = requestAnimationFrame(() => {
      if (pathRef.current) setTileLength(pathRef.current.getComputedTextLength() / TILE_COUNT);
    });
    return () => cancelAnimationFrame(id);
  }, [text]);

  if (!text) return null;

  const content = (text + SEPARATOR).repeat(TILE_COUNT);
  const duration = tileLength ? tileLength / PX_PER_SECOND : 0;

  return (
    <text className={className} key={text}>
      <textPath ref={pathRef} href={`#${pathId}`} xlinkHref={`#${pathId}`} startOffset="0">
        {content}
        {tileLength > 0 && (
          <animate attributeName="startOffset" from="0" to={-tileLength} dur={`${duration}s`} repeatCount="indefinite" />
        )}
      </textPath>
    </text>
  );
}

export default function TrackRing({ title, message }) {
  return (
    <svg className="ring" viewBox="0 0 600 300" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <defs>
        <path id="ring-title-path" d="M 320.9 0.7 A 300 300 0 0 1 548.7 132.3" fill="none" />
        <path id="ring-message-path" d="M 51.3 132.3 A 300 300 0 0 0 279.1 0.7" fill="none" />
      </defs>
      <RingText text={title} pathId="ring-title-path" className="ring__title" />
      <RingText text={message} pathId="ring-message-path" className="ring__message" />
    </svg>
  );
}
