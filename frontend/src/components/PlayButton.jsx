// Three states: off (orange play triangle), loading (spinner, shown while
// the stream is buffering before the first audible sound), on (pause bars).
export default function PlayButton({ state, onClick }) {
  return (
    <button
      className="play-btn"
      data-state={state}
      onClick={onClick}
      aria-label={state === "on" ? "Выключить звук" : "Включить звук"}
      aria-busy={state === "loading"}
    >
      {state === "loading" ? (
        <span className="play-btn__spinner" />
      ) : state === "on" ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 4.7c0-.9 1-1.4 1.7-.9l11 7.3c.6.4.6 1.3 0 1.7l-11 7.3c-.7.5-1.7 0-1.7-.9V4.7z" />
        </svg>
      )}
    </button>
  );
}
