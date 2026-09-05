import { useRef, useState } from "react";

export default function UploadForm({ onUpload }) {
  const fileInputRef = useRef(null);
  const [fileLabel, setFileLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setFileLabel("");
    } else if (files.length === 1) {
      setFileLabel(files[0].name);
    } else {
      setFileLabel(`Выбрано треков: ${files.length}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      setError("Выбери файл");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("file", file);
      }
      await onUpload(formData);
      setFileLabel("");
      fileInputRef.current.value = "";
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="upload">
      <p className="label">Добавить треки</p>
      <form className="upload__form" onSubmit={handleSubmit}>
        <label className="upload__dropzone">
          <input ref={fileInputRef} type="file" multiple accept=".mp3,.ogg,.wav,.flac,.m4a,.m4b" onChange={handleFileChange} />
          <span>{fileLabel || "mp3, ogg, wav, flac, m4a — можно выбрать сразу несколько"}</span>
        </label>

        {error && <p className="upload__error">{error}</p>}

        <button className="pill pill--solid pill--block" type="submit" disabled={uploading}>
          {uploading ? "Загружаю..." : "+ Добавить"}
        </button>
      </form>
    </section>
  );
}
