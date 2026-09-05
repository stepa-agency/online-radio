// Remounting on trackKey change restarts the CSS animations from their
// initial (invisible) frame, which reads as the glow gently "responding"
// to a new track without any real audio analysis.
export default function AmbientGlow({ trackKey }) {
  return (
    <div className="glow" key={trackKey} aria-hidden="true">
      <span className="glow__blob glow__blob--tl" />
      <span className="glow__blob glow__blob--tr" />
      <span className="glow__blob glow__blob--bl" />
      <span className="glow__blob glow__blob--br" />
    </div>
  );
}
