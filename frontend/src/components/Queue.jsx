export default function Queue({ tracks, onPlayNext, onDelete, busyId }) {
  return (
    <section className="queue">
      <div className="queue__header">
        <p className="label">Очередь</p>
        <span className="badge">{tracks.length}</span>
      </div>

      {tracks.length === 0 ? (
        <p className="queue__empty">Пусто. Добавь трек справа.</p>
      ) : (
        <ol className="queue__list">
          {tracks.map((track, index) => (
            <li key={track.id} className="queue__item">
              <span className="queue__index">{String(index + 1).padStart(2, "0")}</span>
              <span className="bullet" />
              <div className="queue__meta">
                <p className="queue__title">{track.title || track.filename}</p>
                {track.artist && <p className="queue__artist">{track.artist}</p>}
              </div>
              <div className="queue__actions">
                <button
                  className="pill pill--small"
                  onClick={() => onPlayNext(track.id)}
                  disabled={busyId === track.id}
                >
                  Play next
                </button>
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
          ))}
        </ol>
      )}
    </section>
  );
}
