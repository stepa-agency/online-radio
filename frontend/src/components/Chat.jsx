import { useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";

const NICKNAME_KEY = "radio-nickname";

function ListenerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="2" y="14" width="5" height="7" rx="1.5" />
      <rect x="17" y="14" width="5" height="7" rx="1.5" />
    </svg>
  );
}

function formatTime(iso) {
  const d = new Date(iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

// Always open, right-hand side of the page — not a toggled overlay
// anymore. The listener count lives down here too, next to the composer,
// rather than as its own floating badge.
export default function Chat({ listenerCount }) {
  const [nickname, setNickname] = useState(() => localStorage.getItem(NICKNAME_KEY) || "");
  const [nameDraft, setNameDraft] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const { messages, send } = useChat();
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

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
    <div className="chat-panel">
      <div className="chat-panel__header">
        <span className="label">Чат</span>
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

      <div className="chat-panel__bottom">
        <div className="chat-panel__listeners">
          <ListenerIcon />
          <span>{listenerCount ?? 0}</span>
        </div>

        {nickname ? (
          <form className="chat-panel__form" onSubmit={handleSend}>
            <input
              className="chat-panel__input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Написать в чат..."
              maxLength={500}
            />
            <button className="chat-panel__send" type="submit" disabled={sending || !text.trim()}>
              →
            </button>
          </form>
        ) : (
          <form className="chat-panel__form" onSubmit={saveNickname}>
            <input
              className="chat-panel__input"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Твой никнейм"
              maxLength={24}
              autoFocus
            />
            <button className="chat-panel__send" type="submit" disabled={!nameDraft.trim()}>
              ОК
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
