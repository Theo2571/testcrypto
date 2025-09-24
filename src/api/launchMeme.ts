// src/api/launchMeme.ts
// @ts-nocheck
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 25_000,
});

/** dataURL -> чистый base64 */
const toPureBase64 = (s: string) => {
  if (!s) return "";
  const i = s.indexOf("base64,");
  return i >= 0 ? s.slice(i + "base64,".length) : s;
};

// ───────────────────────── 1) Загрузка КАРТИНКИ ─────────────────────────
export async function uploadImageJSON(opts: {
  imageBase64: string; // dataURL или чистый base64
  name: string; // для метаданных файла (не токена)
  ticker: string; // для метаданных файла (не токена)
  description?: string;
  socials?: {
    discord?: string;
    telegram?: string;
    twitter?: string;
    website?: string;
  };
}): Promise<{ imageUrl: string }> {
  const { imageBase64, name, ticker, description, socials } = opts;

  const body = {
    file: toPureBase64(imageBase64),
    // сервер /upload часто принимает "metadata" как строку
    metadata: JSON.stringify({ name, symbol: ticker, description, ...socials }),
  };

  const { data } = await api.post("/upload", body, {
    headers: { "Content-Type": "application/json" },
  });

  const imageUrl = data?.image || data?.url || data?.imageUrl || data;
  if (!imageUrl) throw new Error("Upload failed: image url not returned");
  return { imageUrl: String(imageUrl) };
}

// ───────────────────────── 2) Загрузка МЕТАДАННЫХ ─────────────────────────
// На многих бэкендах тот же /upload принимает «metadata» и возвращает ссылку (ipfs/http)
export async function createMetadata(payload: {
  name: string;
  symbol: string;
  description?: string;
  image: string; // imageUrl с шага 1
  discord?: string;
  telegram?: string;
  twitter?: string;
  website?: string;
}): Promise<{ metadataUri: string }> {
  const {
    name,
    symbol,
    description,
    image,
    discord,
    telegram,
    twitter,
    website,
  } = payload;

  const metadata = {
    name,
    symbol,
    description,
    image,
    // некоторые вьюеры любят, когда соцсети внутри объекта
    socials: { discord, telegram, twitter, website },
  };

  // пробуем через /upload, передаём только metadata (без file)
  const { data } = await api.post(
    "/upload",
    { metadata: JSON.stringify(metadata) },
    { headers: { "Content-Type": "application/json" } },
  );

  const metadataUri = data?.metadataUri || data?.uri || data?.url || data;
  if (!metadataUri) throw new Error("Upload failed: metadata uri not returned");
  return { metadataUri: String(metadataUri) };
}

// ───────────────────────── 3) Генерация транзакции ─────────────────────────
// ПРИНИМАЕТ ТОЛЬКО: tokenName, tokenSymbol, metadataUri, userPubkey, firstBuyAmount?
export async function generateTokenTx(opts: {
  name: string; // будет отправлено как tokenName
  symbol: string; // будет отправлено как tokenSymbol
  metadataUri: string;
  userPubkey: string; // base58
  firstBuyAmount?: number; // опционально
}): Promise<string | Uint8Array | object> {
  // нормализуем и проверяем лимиты до запроса, чтобы не ловить 400
  const trim = (s: string) => String(s ?? "").trim();

  const tokenName = trim(opts.name).slice(0, 50);
  const tokenSymbol = trim(opts.symbol).slice(0, 10);
  const metadataUri = trim(opts.metadataUri).slice(0, 250);
  const userPubkey = trim(opts.userPubkey);

  if (!tokenName)
    throw new Error("tokenName is required and must be non-empty");
  if (!tokenSymbol)
    throw new Error("tokenSymbol is required and must be non-empty");
  if (!metadataUri)
    throw new Error("metadataUri is required and must be non-empty");
  if (!userPubkey)
    throw new Error("userPubkey is required and must be non-empty");

  const payload: any = {
    tokenName,
    tokenSymbol,
    metadataUri,
    userPubkey,
  };

  if (opts.firstBuyAmount != null) {
    const n = Number(opts.firstBuyAmount);
    if (!Number.isFinite(n) || n < 0)
      throw new Error("firstBuyAmount must be a non-negative number");
    payload.firstBuyAmount = n;
  }

  const { data } = await api.post("/generate-token-tx", payload, {
    headers: { "Content-Type": "application/json" },
    validateStatus: (s) => s >= 200 && s < 300,
  });

  // сервер может вернуть разные ключи
  const tx =
    data?.txPayload || data?.transaction || data?.tx || data?.payload || data;

  if (!tx) throw new Error("No tx payload in response");
  return tx;
}
