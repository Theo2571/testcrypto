// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { mapTokenFromApi, mapTokenFromWs } from "../utils/mapTokenFromApi";

const API_URL = "https://launch.meme/api";
const WS_URL = "wss://launch.meme/connection/websocket?format=json";
const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJpYXQiOjE3NTcxNjY4ODh9.VEvlNmvIFS3ARM5R0jlNN4fwDDRz94WnKv8LDmtipNE";

const PING_INTERVAL_MS = 45_000; // keepalive "{}"
const IMMEDIATE_PING_COOLDOWN_MS = 5_000; // анти-луп на ответный "{}"
const LIMIT = 300;

// ---------- IPFS helpers ----------
const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
];

const ipfsToHttp = (uri?: string) => {
  if (!uri) return undefined;
  if (uri.startsWith("ipfs://")) {
    const cidPath = uri.replace("ipfs://", "");
    return `${IPFS_GATEWAYS[0]}${cidPath}`;
  }
  return uri; // уже http(s)
};

// чтобы не ддосить одинаковые metadataUri
const metaRequested = new Set<string>();

async function fetchAndApplyMetadata(
  ca: string,
  metadataUri: string | undefined,
  setTokensCb: React.Dispatch<any>,
) {
  if (!metadataUri) return;
  const key = `${ca}:${metadataUri}`;
  if (metaRequested.has(key)) return;
  metaRequested.add(key);

  try {
    const url = ipfsToHttp(metadataUri);
    if (!url) return;

    const { data } = await axios.get(url, { timeout: 12_000 });

    // в метадате обычно { name, symbol, description, image, ... }
    const imgRaw: string | undefined = data?.image || data?.logo || data?.icon;
    const img = ipfsToHttp(imgRaw);

    if (!img) return;

    // мягкий апдейт только иконки/описания/имени
    setTokensCb((prev: any[]) =>
      prev.map((t) =>
        String(t.ca || "").toLowerCase() === ca
          ? {
              ...t,
              icon: t.icon && !/empty\.gif$/i.test(t.icon) ? t.icon : img,
              description: t.description ?? data?.description ?? t.description,
              name: t.name ?? data?.name ?? t.name,
            }
          : t,
      ),
    );
  } catch (_) {
    // молча, чтобы не шуметь
  }
}

export function useTokens() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const lastImmediatePingAt = useRef(0);

  // -------- Первичная загрузка --------
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const formData = new URLSearchParams();
        formData.append("page", "1");
        formData.append("version", "1");

        const res = await axios.post(`${API_URL}/tokens`, formData, {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });

        const raw = res.data;
        const source = raw.tokens ?? raw.data ?? raw;

        const tokenArray = Object.entries(source)
          .filter(([, t]) => typeof t === "object" && t !== null)
          .map(([ca, t]) => mapTokenFromApi(ca, t));

        setTokens(tokenArray);

        // сразу попробуем подтянуть метадаты там, где photo пустой
        tokenArray.forEach((t: any) => {
          const photoBad = !t.icon || /empty\.gif$/i.test(t.icon);
          if (photoBad && t.metadataUri) {
            fetchAndApplyMetadata(
              String(t.ca || "").toLowerCase(),
              t.metadataUri,
              setTokens,
            );
          }
        });
      } catch (err) {
        console.error("Error fetching tokens:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  // -------- WebSocket --------
  useEffect(() => {
    let ws: WebSocket | null = null;
    let pingInterval: any;
    let reconnectTimeout: any;
    let destroyed = false;
    let reconnectAttempts = 0;

    const clearTimers = () => {
      if (pingInterval) clearInterval(pingInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };

    const sendPing = () => {
      if (ws && ws.readyState === WebSocket.OPEN) ws.send("{}");
    };

    const setupPing = () => {
      if (pingInterval) clearInterval(pingInterval);
      if (PING_INTERVAL_MS > 0) {
        pingInterval = setInterval(sendPing, PING_INTERVAL_MS);
      }
    };

    const subscribe = (channel: string, id: number) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({ subscribe: { channel }, id }));
    };

    const initWebSocket = () => {
      if (destroyed) return;
      clearTimers();

      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempts = 0;
        setupPing();

        // обязательный connect
        ws!.send(
          JSON.stringify({
            connect: {
              token: TOKEN,
              name: "js",
              client: "react-app",
              version: "1.0.0",
            },
            id: 1,
          }),
        );

        // подписываемся на оба канала сразу
        subscribe("meteora-tokenUpdates", 3);
        subscribe("meteora-mintTokens", 2);
      };

      ws.onmessage = (event) => {
        const raw = typeof event.data === "string" ? event.data : "";
        // иногда несколько сообщений приходят в одном фрейме
        const chunks = raw ? raw.split(/\r?\n/).filter(Boolean) : [""];

        for (const chunk of chunks) {
          const str = chunk.trim();

          // heartbeat "{}" от сервера
          if (str === "{}") {
            const now = Date.now();
            if (
              now - lastImmediatePingAt.current >
              IMMEDIATE_PING_COOLDOWN_MS
            ) {
              sendPing();
              lastImmediatePingAt.current = now;
            }
            continue;
          }

          let msg: any;
          try {
            msg = str ? JSON.parse(str) : null;
          } catch {
            continue;
          }
          if (!msg || typeof msg !== "object") continue;

          // служебные ACK-и
          if ("pong" in msg) continue;
          if (msg?.id === 1 && msg.connect) continue;
          if (msg?.subscribe && (msg?.id === 2 || msg?.id === 3)) continue;

          // достаём полезную нагрузку
          const payloadRaw =
            msg?.push?.pub?.data ??
            msg?.push?.data ??
            msg?.data ??
            msg?.payload ??
            msg?.d ??
            null;
          if (!payloadRaw) continue;

          let payload = payloadRaw;
          if (typeof payloadRaw === "string") {
            try {
              payload = JSON.parse(payloadRaw);
            } catch {
              continue;
            }
          }

          // нормализация CA
          const caRaw =
            payload.ca ??
            payload.token ??
            payload.address ??
            payload.mint ??
            payload.contract ??
            null;
          if (!caRaw) continue;
          const ca = String(caRaw).toLowerCase();

          // нормализуем время: иногда в сек, иногда уже в мс
          if (payload.mint_time) {
            const ts = Number(payload.mint_time);
            payload._mint_ms = ts > 1e12 ? ts : ts * 1000;
          }

          // маппер в твой формат
          const normalized = { token: ca, ...payload };
          const update = mapTokenFromWs(normalized);

          // апсерт
          setTokens((prev: any[]) => {
            const idx = prev.findIndex(
              (t) => String(t.ca || "").toLowerCase() === ca,
            );

            const fromPhoto =
              payload.photo && !/empty\.gif$/i.test(payload.photo)
                ? payload.photo
                : undefined;

            const merged = {
              ...(idx >= 0 ? prev[idx] : {}),
              ...Object.fromEntries(
                Object.entries(update).filter(([, v]) => v !== undefined),
              ),
              ca,
              icon:
                update.icon ??
                fromPhoto ??
                (idx >= 0 ? prev[idx].icon : undefined),
              metadataUri:
                payload.metadataUri ??
                (idx >= 0 ? prev[idx].metadataUri : undefined),
              time:
                update.time ??
                (payload._mint_ms
                  ? new Date(payload._mint_ms).toLocaleString()
                  : idx >= 0
                    ? prev[idx].time
                    : new Date().toLocaleString()),
            };

            let next =
              idx >= 0
                ? prev.map((t, i) => (i === idx ? merged : t))
                : [merged, ...prev];

            // дедуп по ca
            const seen = new Set<string>();
            next = next.filter((t) => {
              const k = String(t.ca || "").toLowerCase();
              if (seen.has(k)) return false;
              seen.add(k);
              return true;
            });

            if (next.length > LIMIT) next = next.slice(0, LIMIT);
            return next;
          });

          // если картинка всё ещё заглушка — пробуем metadataUri → image
          const photoBad = !payload.photo || /empty\.gif$/i.test(payload.photo);
          if (photoBad && payload.metadataUri) {
            fetchAndApplyMetadata(ca, payload.metadataUri, setTokens);
          }
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      ws.onclose = (ev) => {
        clearTimers();
        if (destroyed || ev.code === 1000) return;

        // реконнект с экспоненциальной задержкой
        reconnectAttempts += 1;
        const delay = Math.min(3000 * reconnectAttempts, 30_000);
        reconnectTimeout = setTimeout(initWebSocket, delay);
      };
    };

    initWebSocket();

    return () => {
      destroyed = true;
      clearTimers();
      try {
        if (
          ws &&
          (ws.readyState === WebSocket.OPEN ||
            ws.readyState === WebSocket.CONNECTING)
        ) {
          ws.close(1000, "Component unmount");
        }
      } catch {}
      ws = null;
      wsRef.current = null;
    };
  }, []);

  return { tokens, loading };
}
