export const DYNAMIC_KEYS = new Set([
  "volume",
  "buys",
  "sells",
  "marketCap",
  "price",
  "percent",
  "holders",
  "holdersPercent",
  "time",
]);

export const isNonEmpty = (v: any) =>
  v !== undefined && v !== null && !(typeof v === "string" && v.trim() === "");

export const pickDynamicNonEmpty = (obj: any) => {
  const out: any = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    if (DYNAMIC_KEYS.has(k) && isNonEmpty(v)) out[k] = v;
  }
  return out;
};
