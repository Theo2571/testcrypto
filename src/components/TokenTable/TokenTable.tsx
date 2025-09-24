// @ts-nocheck
import React from "react";
import TokenCard from "../TokenCard/TokenCard";

interface TokenTableProps {
  tokens: any[];
  darkMode: boolean;
  theme: any;
}

// валидная фотка = непустая строка и не стандартная заглушка
const photoValid = (p?: string) => {
  const s = String(p ?? "").trim();
  if (!s) return false;
  if (/empty\.gif$/i.test(s)) return false;
  return true; // пропускаем любые http(s)/ipfs/data, с query — тоже ок
};

const nameValid = (n?: string) => String(n ?? "").trim().length > 0;

const TokenTable: React.FC<TokenTableProps> = ({ tokens, darkMode, theme }) => {
  const list = Array.isArray(tokens) ? tokens : [];

  // показываем: ТОЛЬКО если есть фотка и есть имя
  const visible = list.filter(
    (t) => photoValid(t.icon || t.photo) || nameValid(t.name),
  );

  if (visible.length === 0) {
    return (
      <div style={{ padding: 20, color: theme.secondary }}>Нет данных</div>
    );
  }

  return (
    <div className="desktop-table">
      {/* Заголовки */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 1.5fr 1fr 1fr 1fr 1fr auto",
          padding: "12px 16px",
          background: darkMode
            ? "linear-gradient(90deg, #1e293b, #0f172a)"
            : "linear-gradient(90deg, #f1f5f9, #e2e8f0)",
          color: darkMode ? "#cbd5e1" : "#475569",
          fontWeight: 700,
          fontSize: 13,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
      >
        <div style={{ textAlign: "left" }}>TOKEN</div>
        <div style={{ textAlign: "left" }}>CA</div>
        <div style={{ textAlign: "center" }}>VOLUME</div>
        <div style={{ textAlign: "center" }}>MARKET CAP</div>
        <div style={{ textAlign: "center" }}>PROGRESS</div>
        <div style={{ textAlign: "center" }}># HOLDERS</div>
        <div style={{ textAlign: "center" }}>TRADE</div>
      </div>

      {/* Список */}
      <div
        style={{
          border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
          borderTop: "none",
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
          overflow: "hidden",
        }}
      >
        {visible.map((token: any, i: number) => (
          <TokenCard
            key={`${token.ca}-${token.time ?? i}`}
            token={token}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
};

export default TokenTable;
