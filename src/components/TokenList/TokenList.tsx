// @ts-nocheck
import React from "react";
import TokenCard from "../../components/TokenCard/TokenCard";

interface TokenListProps {
  tokens: any; // массив [{...}] или объект { ... } — ниже нормализуем
  theme: any;
  darkMode: boolean;
}

// валидная фотка: непустая и не стандартная заглушка
const photoValid = (p?: string) => {
  const s = String(p ?? "").trim();
  if (!s) return false;
  if (/empty\.gif$/i.test(s)) return false;
  return true;
};

const nameValid = (n?: string) => String(n ?? "").trim().length > 0;

const TokenList: React.FC<TokenListProps> = ({ tokens, theme, darkMode }) => {
  // Нормализуем в массив
  const list = Array.isArray(tokens)
    ? tokens
    : tokens && typeof tokens === "object"
      ? Object.values(tokens)
      : [];

  // Фильтр: только с валидной фоткой и непустым именем
  const visible = list.filter(
    (t: any) => photoValid(t.icon || t.photo) && nameValid(t.name),
  );

  return (
    <div
      className="mobile-list"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
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
  );
};

export default TokenList;
