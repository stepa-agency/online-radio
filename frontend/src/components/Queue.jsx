export default function Queue({ tracks, onPlayNow, onDelete, busyId }) {
  const upcoming = tracks.filter((t) => t.status !== "playing");

  return (
    <section className="queue">
      <div className="queue__header">
        <p className="label">Очередь</p>
        <span className="badge">{tracks.length}</span>
      </div>

      {tracks.length === 0 ? (
        <p className="queue__empty">Пусто. Добавь трек справа.</p>
      ) : (
        <>
          <p className="queue__hint">Треки играют по порядку сами, друг за другом.</p>
          <ol className="queue__list">
            {tracks.map((track) => {
              const isPlaying = track.status === "playing";
              const upcomingIndex = upcoming.indexOf(track);
              return (
                <li key={track.id} className={`queue__item ${isPlaying ? "queue__item--playing" : ""}`}>
                  {isPlaying ? (
                    <span className="queue__on-air">
                      <span className="live-dot live-dot--on" />
                      ЭФИР
                    </span>
                  ) : (
                    <span className="queue__index">{String(upcomingIndex + 1).padStart(2, "0")}</span>
                  )}
                  <span className="bullet" />
                  <div className="queue__meta">
                    <p className="queue__title">{track.title || track.filename}</p>
                    {track.artist && <p className="queue__artist">{track.artist}</p>}
                  </div>
                  <div className="queue__actions">
                    {!isPlaying && (
                      <button
                        className="pill pill--small"
                        onClick={() => onPlayNow(track.id)}
                        disabled={busyId === track.id}
                      >
                        Play now
                      </button>
                    )}
                    <button
                      className="icon-button"
                      onClick={() => onDelete(track.id)}
                      disabled={busyId === track.id}
                      aria-label="Удалить"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </section>
  );
}
