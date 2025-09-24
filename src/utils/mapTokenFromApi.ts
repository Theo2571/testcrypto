// ========= helpers =========
const toNum = (v: unknown) => {
  if (v === null || v === undefined) return NaN;
  if (typeof v === "number") return v;
  let s = String(v).replace(/[^\d.,eE\-+]/g, "");
  if (!s.includes(".") && !s.includes(",")) return Number(s);

  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  const decimalSep = lastDot > lastComma ? "." : ",";
  const thousandSep = decimalSep === "." ? "," : ".";

  s = s.split(thousandSep).join("");
  s = s.replace(decimalSep, ".");

  const parts = s.split(".");
  if (parts.length > 2) s = parts[0] + "." + parts.slice(1).join("");
  return Number(s);
};

const fmtMoney = (n: unknown) => {
  const x = toNum(n);
  return Number.isFinite(x) ? `$${x.toLocaleString()}` : "-";
};

const shortCa = (s: string) =>
  s && s.length > 10 ? `${s.slice(0, 4)}...${s.slice(-4)}` : s;

/** mint_time / last_tx_time в МИЛЛИСЕКУНДАХ */
const toLocalTime = (ms?: unknown) => {
  const n = toNum(ms);
  return Number.isFinite(n) ? new Date(n).toLocaleString() : undefined;
};

const validPhoto = (p?: string) => !!p && !/empty\.gif$/i.test(String(p));

// ========= public mappers =========

/** Полноценная запись из REST (со статикой и динамикой) */
export function mapTokenFromApi(ca: string, t: any) {
  if (!t || typeof t !== "object") return skeletonToken(ca);

  const caL = String(ca).toLowerCase();
  const name = t.name || t.symbol || shortCa(caL);

  return {
    // статика
    icon: validPhoto(t.photo) ? t.photo : t.image || t.logo || t.logoURI || "",
    name,
    description: t.description || "",
    ca: caL,
    creator: t.creator || "",
    author: t.creator || "",
    symbol: t.symbol || "",
    telegram: t.telegram || "",
    x: t.x || "",
    website: t.website || "",
    metadataUri: t.metadataUri || t.metadata || "",
    tokenType: t.tokenType || (t.SPL ? "SPL" : ""),
    // динамика (строки с $ — как раньше)
    volume: fmtMoney(t.volumeUsd),
    buys: t.buys ?? 0,
    sells: t.sells ?? 0,
    marketCap: fmtMoney(t.marketCapUsd),
    price: Number.isFinite(toNum(t.priceUsd)) ? `$${toNum(t.priceUsd)}` : "-",
    percent: 0,
    holders: t.holders ?? 0,
    holdersPercent: t.topHoldersPercentage ?? 0,
    time: toLocalTime(t.mint_time),
    txCount: t.txCount ?? 0,
  };
}

/** Скелет — чтобы новая запись никогда не выглядела пустой */
export function skeletonToken(ca: string) {
  const caL = String(ca).toLowerCase();
  return {
    icon: "",
    name: shortCa(caL),
    description: "",
    ca: caL,
    volume: "-",
    buys: 0,
    sells: 0,
    marketCap: "-",
    price: "-",
    percent: 0,
    holders: 0,
    holdersPercent: 0,
    time: new Date().toLocaleString(),
    author: "",
    creator: "",
    symbol: "",
    telegram: "",
    x: "",
    website: "",
    metadataUri: "",
    tokenType: "",
    txCount: 0,
  };
}

/** Патч из WS: пишем только непустые поля; добавили creator/name/links */
export function mapTokenFromWs(t: any): Partial<any> {
  const patch: Record<string, any> = {};

  const money = (n: unknown) => {
    const num = toNum(n);
    return Number.isFinite(num) ? `$${num.toLocaleString()}` : "-";
  };

  const setIf = (key: string, val: unknown, map?: (v: any) => any) => {
    if (val === undefined || val === null || val === "") return;
    patch[key] = map ? map(val) : val;
  };

  // статика, которая может появиться по WS
  setIf("creator", t.creator);
  setIf("author", t.creator ?? t.author);
  setIf("name", t.name || t.symbol);
  setIf("description", t.description);
  setIf("x", t.x);
  setIf("website", t.website);
  setIf("metadataUri", t.metadataUri);
  if (validPhoto(t.photo)) patch.icon = t.photo;

  // динамика
  setIf("buys", t.buys);
  setIf("sells", t.sells);
  setIf("holders", t.holders);
  setIf("holdersPercent", t.topHoldersPercentage);

  setIf("marketCap", t.marketCapUsd, money);
  setIf("price", t.priceUsd ?? t.price, (v: number | string) =>
    Number.isFinite(toNum(v)) ? `$${toNum(v)}` : String(v),
  );
  setIf("volume", t.volumeUsd, money);

  setIf("txCount", t.txCount);

  // нормализуем время: иногда сек, иногда мс
  const ts = t.last_tx_time ?? t.mint_time;
  if (ts !== undefined && ts !== null) {
    const n = toNum(ts);
    const ms = n > 1e12 ? n : n * 1000;
    patch.time = new Date(ms).toLocaleString();
  }

  return patch;
}
