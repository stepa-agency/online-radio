import { useEffect, useState } from "react";

export default function MessageForm({ initialText, onSave }) {
  const [text, setText] = useState(initialText ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setText(initialText ?? "");
  }, [initialText]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(text);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="message-form">
      <p className="label">Сообщение слушателям</p>
      <form className="message-form__form" onSubmit={handleSubmit}>
        <textarea
          className="text-input message-form__textarea"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Например: сегодня в эфире..."
        />
        <button className="pill pill--solid pill--block" type="submit" disabled={saving}>
          {saving ? "Сохраняю..." : "Сохранить"}
        </button>
      </form>
    </section>
  );
}
