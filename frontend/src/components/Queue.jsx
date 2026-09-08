function formatMinutesLeft(seconds) {
  if (!seconds || seconds <= 0) return null;
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return "меньше минуты";
  if (minutes === 1) return "1 минуту";
  if (minutes < 5) return `${minutes} минуты`;
  return `${minutes} минут`;
}

export default function Queue({ tracks, onPlayNow, onDelete, onMove, busyId, secondsLeft }) {
  const upcoming = tracks.filter((t) => t.status !== "playing");
  const queuedOnly = tracks.filter((t) => t.status === "queued");
  const minutesLeft = formatMinutesLeft(secondsLeft);

  return (
    <section className="queue">
      <div className="queue__header">
        <p className="label">Очередь</p>
        <span className="badge">{tracks.length}</span>
        {minutesLeft && <span className="queue__runway">хватит на {minutesLeft}</span>}
      </div>

      {tracks.length === 0 ? (
        <p className="queue__empty">Пусто. Добавь трек справа.</p>
      ) : (
        <>
          <p className="queue__hint">Треки играют по порядку сами, друг за другом.</p>
          <ol className="queue__list">
            {tracks.map((track) => {
              const isPlaying = track.status === "playing";
              const isQueued = track.status === "queued";
              const upcomingIndex = upcoming.indexOf(track);
              const queuedIndex = isQueued ? queuedOnly.indexOf(track) : -1;
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
                    {isQueued && (
                      <div className="queue__reorder">
                        <button
                          className="icon-button"
                          onClick={() => onMove(track.id, "up")}
                          disabled={busyId === track.id || queuedIndex === 0}
                          aria-label="Выше"
                        >
                          ↑
                        </button>
                        <button
                          className="icon-button"
                          onClick={() => onMove(track.id, "down")}
                          disabled={busyId === track.id || queuedIndex === queuedOnly.length - 1}
                          aria-label="Ниже"
                        >
                          ↓
                        </button>
                      </div>
                    )}
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
