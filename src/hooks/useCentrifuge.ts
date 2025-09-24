import { useEffect } from "react";

export function useCentrifuge() {
  useEffect(() => {
    const ws = new WebSocket(
      "wss://launch.meme/connection/websocket?format=json",
    );

    ws.onopen = () => {
      console.log("WebSocket connected");

      // авторизация токеном
      ws.send(
        JSON.stringify({
          method: "connect",
          params: { token: "eyJhbGciOi..." },
        }),
      );

      // подписка на канал токенов (пример, надо глянуть в swagger/docs какой канал есть)
      ws.send(
        JSON.stringify({
          method: "subscribe",
          params: { channel: "tokens" },
        }),
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WS message:", data);

      // тут обновляешь state с токенами или ордерами
    };

    ws.onclose = () => console.log("WebSocket closed");

    return () => ws.close();
  }, []);
}
