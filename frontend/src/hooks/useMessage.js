import { useCallback, useEffect, useState } from "react";
import { api } from "../api";

// Polls continuously so listeners see updates without reloading.
export function useMessage() {
  const [text, setText] = useState("");

  const refresh = useCallback(() => {
    api.getMessage().then((data) => setText(data.text)).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  return text;
}
