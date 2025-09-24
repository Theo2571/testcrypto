// @ts-nocheck
/** Преобразует строку с валютой/разделителями в число.
 * Поддерживает оба формата:
 * - "$1,234,567.89"
 * - "$1 234 567,89"
 */
const toNum = (v: any) => {
  if (v === null || v === undefined) return NaN;
  if (typeof v === "number") return v;

  // оставим только цифры, точку, запятую, минус и экспоненту
  let s = String(v).replace(/[^\d.,eE\-+]/g, "");

  // если нет ни точки, ни запятой — просто Number(...)
  if (!s.includes(".") && !s.includes(",")) return Number(s);

  // определяем десятичный разделитель: тот, что встречается ПОЗЖЕ в строке
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  const decimalSep = lastDot > lastComma ? "." : ","; // кто правее — тот и десятичный
  const thousandSep = decimalSep === "." ? "," : ".";

  // убираем разделители тысяч и меняем десятичный на точку
  s = s.split(thousandSep).join("");
  s = s.replace(decimalSep, ".");

  // на всякий случай уберём повторные десятичные
  const parts = s.split(".");
  if (parts.length > 2) {
    s = parts[0] + "." + parts.slice(1).join(""); // "1.234.567" -> "1.234567"
  }

  return Number(s);
};

// Компактная валюта: $7K, $2.3M, $1.3B ...
export const compactUSD = (v: any) => {
  const n = toNum(v);
  if (!Number.isFinite(n)) return "-";
  if (Math.abs(n) < 1) {
    const digits = Math.abs(n) < 0.01 ? 6 : 4;
    return `$${n.toFixed(digits)}`;
  }
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: Math.abs(n) < 100 ? 2 : 1,
    minimumFractionDigits: 0,
  }).format(n);
};

// Цена: $0.1240, $2.18, $1.22, $0.005326 ...
export const prettyPriceUSD = (v: any) => {
  const n = toNum(v);
  if (!Number.isFinite(n)) return "-";
  if (n === 0) return "$0";
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  if (n < 100) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(2)}`;
};

export const compactInt = (v: any) => {
  const n = toNum(v);
  if (!Number.isFinite(n)) return "-";
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
};
