import { useRef, useState } from "react";

export default function UploadForm({ onUpload }) {
  const fileInputRef = useRef(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Выбери файл");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (title) formData.append("title", title);
      if (artist) formData.append("artist", artist);
      await onUpload(formData);
      setTitle("");
      setArtist("");
      setFileName("");
      fileInputRef.current.value = "";
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="upload">
      <p className="label">Добавить трек</p>
      <form className="upload__form" onSubmit={handleSubmit}>
        <label className="upload__dropzone">
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.ogg,.wav,.flac,.m4a"
            onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
          />
          <span>{fileName || "mp3, ogg, wav, flac, m4a"}</span>
        </label>

        <div className="upload__fields">
          <input
            className="text-input"
            placeholder="Название (необязательно)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="text-input"
            placeholder="Исполнитель (необязательно)"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />
        </div>

        {error && <p className="upload__error">{error}</p>}

        <button className="pill pill--solid pill--block" type="submit" disabled={uploading}>
          {uploading ? "Загружаю..." : "+ Добавить"}
        </button>
      </form>
    </section>
  );
}
