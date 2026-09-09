import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";

// Polls rather than pushing over SSE — chat can tolerate a few seconds of
// lag, and polling sidesteps the Cloudflare tunnel's streaming quirks
// entirely (see the likes endpoint for what that would otherwise take).
export function useChat() {
  const [messages, setMessages] = useState([]);
  const lastIdRef = useRef(0);

  const refresh = useCallback(() => {
    api
      .getChat()
      .then((rows) => {
        setMessages(rows);
        if (rows.length) lastIdRef.current = rows[rows.length - 1].id;
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, [refresh]);

  const send = async (nickname, text) => {
    const msg = await api.postChat(nickname, text);
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  };

  return { messages, send };
}
