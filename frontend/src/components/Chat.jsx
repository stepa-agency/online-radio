import { useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";

const NICKNAME_KEY = "radio-nickname";

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v12H8l-4 4V4z" />
    </svg>
  );
}

function formatTime(iso) {
  const d = new Date(iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export default function Chat() {
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState(() => localStorage.getItem(NICKNAME_KEY) || "");
  const [nameDraft, setNameDraft] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const { messages, send } = useChat();
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const saveNickname = (e) => {
    e.preventDefault();
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    localStorage.setItem(NICKNAME_KEY, trimmed);
    setNickname(trimmed);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await send(nickname, trimmed);
      setText("");
    } catch {
      // Chat is low-stakes — a failed send just leaves the draft in the box.
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button className="chat-toggle" onClick={() => setOpen((v) => !v)} aria-label="Чат">
        <ChatIcon />
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-panel__header">
            <span className="label">Чат</span>
            <button className="chat-panel__close" onClick={() => setOpen(false)} aria-label="Закрыть">
              ✕
            </button>
          </div>

          <div className="chat-panel__messages" ref={listRef}>
            {messages.length === 0 && <p className="chat-panel__empty">Пока никто не писал.</p>}
            {messages.map((m) => (
              <div className="chat-msg" key={m.id}>
                <span className="chat-msg__nick">{m.nickname}</span>
                <span className="chat-msg__text">{m.text}</span>
                <span className="chat-msg__time">{formatTime(m.created_at)}</span>
              </div>
            ))}
          </div>

          {nickname ? (
            <form className="chat-panel__form" onSubmit={handleSend}>
              <input
                className="text-input chat-panel__input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Написать в чат..."
                maxLength={500}
              />
              <button className="pill pill--solid pill--small" type="submit" disabled={sending || !text.trim()}>
                →
              </button>
            </form>
          ) : (
            <form className="chat-panel__form" onSubmit={saveNickname}>
              <input
                className="text-input chat-panel__input"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Твой никнейм"
                maxLength={24}
                autoFocus
              />
              <button className="pill pill--solid pill--small" type="submit" disabled={!nameDraft.trim()}>
                ОК
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
