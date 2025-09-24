// @ts-nocheck
import React from "react";
import { Button, ProgressBar } from "antd-mobile";
import { Theme } from "../../context/ThemeContext";
import { Token } from "../../types/token";
import { compactInt, compactUSD, prettyPriceUSD } from "../../utils/format";

interface TokenCardProps {
  token: Token;
  theme: Theme;
}

// helpers
const short = (s?: string, n = 4) =>
  s ? `${s.slice(0, n)}...${s.slice(-n)}` : "";
const hasText = (s?: string) => !!String(s ?? "").trim();

const useMedia = (query: string) => {
  const [matches, setMatches] = React.useState<boolean>(
    window.matchMedia(query).matches,
  );
  React.useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);
  return matches;
};

// иконка-кнопка копирования
const CopyIconBtn: React.FC<{
  value: string;
  color?: string;
  size?: number;
}> = ({ value, color = "#94a3b8", size = 16 }) => {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      } finally {
        document.body.removeChild(ta);
      }
    }
  };
  return (
    <button
      onClick={copy}
      title={copied ? "Copied!" : "Copy CA"}
      aria-label="Copy CA"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 6,
        height: size + 6,
        borderRadius: 6,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        padding: 0,
        marginLeft: 6,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke={copied ? "#10b981" : color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="3" width="13" height="18" rx="2" ry="2"></rect>
        <path d="M5 7H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1"></path>
      </svg>
    </button>
  );
};

// маленькие ссылки-иконки (X и website)
const IconLink: React.FC<{
  href: string;
  title: string;
  kind: "x" | "web";
  size?: number;
}> = ({ href, title, kind, size = 16 }) => {
  if (!href) return null;
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: size + 6,
    height: size + 6,
    borderRadius: 6,
    marginLeft: 8,
    textDecoration: "none",
  } as const;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={title}
      style={base as any}
    >
      {kind === "x" ? (
        // X (Twitter)
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="currentColor"
          style={{ color: "#94a3b8" }}
        >
          <path d="M18.244 3H21l-6.54 7.47L22.5 21h-5.79l-4.53-5.33L6.06 21H3.3l6.98-7.97L1.5 3h5.91l4.1 4.82L18.24 3Zm-2.04 16.2h1.6L7.89 4.73H6.2l10.004 14.47Z" />
        </svg>
      ) : (
        // Globe (website)
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M2.1 12h19.8M12 2.1c3.2 3.1 3.2 16.7 0 19.8M12 2.1c-3.2 3.1-3.2 16.7 0 19.8" />
        </svg>
      )}
    </a>
  );
};

const TokenCard: React.FC<TokenCardProps> = ({ token, theme }) => {
  const isMobile = useMedia("(max-width: 640px)");
  const isSmallMobile = useMedia("(max-width: 375px)");
  const creator = token.creator || token.author || "";

  // значения для UI (принимают как числа, так и строки с $)
  const volumeVal = token.volumeUsd ?? token.volume;
  const mcapVal = token.marketCapUsd ?? token.marketCap;
  const priceVal = token.priceUsd ?? token.price;

  if (isMobile) {
    /* ===== Mobile ===== */
    return (
      <div
        style={{
          backgroundColor: theme.surface,
          color: theme.text,
          borderBottom: `1px solid ${theme.border}`,
          padding: isSmallMobile ? "10px" : "16px",
          fontSize: isSmallMobile ? 12 : 14,
          display: "flex",
          flexDirection: "column",
          gap: isSmallMobile ? 6 : 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {token.icon && (
            <img
              src={token.icon}
              alt={token.name}
              style={{
                width: isSmallMobile ? 28 : 36,
                height: isSmallMobile ? 28 : 36,
                borderRadius: "50%",
              }}
            />
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {/* name + social icons */}
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ fontWeight: 600 }}>{token.name}</div>
              {hasText(token.x) && (
                <IconLink kind="x" href={token.x} title="Twitter / X" />
              )}
              {hasText(token.website) && (
                <IconLink kind="web" href={token.website} title="Website" />
              )}
            </div>

            {/* CA + copy */}
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.4,
                display: "flex",
                gap: 6,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  color: theme.secondary,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
                title={token.ca}
              >
                {short(token.ca, 4)}
              </span>
              <CopyIconBtn value={token.ca} />
            </div>

            {/* by creator */}
            {creator && (
              <a
                href={`https://solscan.io/account/${creator}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "#3b82f6",
                  textDecoration: "none",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
                title={creator}
              >
                by {short(creator, 4)}
              </a>
            )}
          </div>
        </div>

        {token.description && (
          <div style={{ fontSize: 12, color: theme.secondary }}>
            {token.description}
          </div>
        )}

        <div>
          💵 Volume: <b>{compactUSD(volumeVal)}</b>
        </div>

        <div>
          🏦 Market Cap: <b>{compactUSD(mcapVal)}</b>{" "}
          <span
            style={{
              color: prettyPriceUSD(priceVal).startsWith("$0")
                ? "#ef4444"
                : "#22c55e",
            }}
          >
            {prettyPriceUSD(priceVal)}
          </span>
        </div>

        <div>
          <ProgressBar
            percent={token.percent ?? 0}
            text={false}
            style={{
              "--track-color": theme.border,
              "--fill-color": "#6366f1",
              width: "100%",
            }}
          />
        </div>

        <div>
          👥 Holders: {compactInt(token.holders)} ({token.holdersPercent ?? 0}%)
        </div>

        <Button
          color="primary"
          size="small"
          style={{
            background: "linear-gradient(90deg,#3b82f6,#06b6d4)",
            border: "none",
            fontWeight: 600,
            borderRadius: 8,
            marginTop: 8,
          }}
        >
          Trade
        </Button>
      </div>
    );
  }

  /* ===== Desktop row ===== */
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "3fr 1.5fr 1fr 1fr 1fr 1fr auto",
        alignItems: "center",
        padding: "14px 18px",
        backgroundColor: theme.surface,
        color: theme.text,
        borderBottom: `1px solid ${theme.border}`,
        fontSize: 14,
      }}
    >
      {/* TOKEN */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {token.icon && (
          <img
            src={token.icon}
            alt={token.name}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          />
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* name + icons */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ fontWeight: 600 }}>{token.name}</div>
            {hasText(token.x) && (
              <IconLink kind="x" href={token.x} title="Twitter / X" />
            )}
            {hasText(token.website) && (
              <IconLink kind="web" href={token.website} title="Website" />
            )}
          </div>

          {token.description && (
            <div
              style={{
                fontSize: 12,
                color: theme.secondary,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 180,
              }}
              title={token.description}
            >
              {token.description}
            </div>
          )}
          <div style={{ fontSize: 11, color: theme.secondary, marginTop: 2 }}>
            {token.time || "just now"}
          </div>
        </div>
      </div>

      {/* CA + copy + by */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span
            style={{
              fontSize: 13,
              color: theme.secondary,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
            title={token.ca}
          >
            {short(token.ca, 4)}
          </span>
          <CopyIconBtn value={token.ca} />
        </div>
        {creator && (
          <a
            href={`https://solscan.io/account/${creator}`}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: 12,
              color: "#3b82f6",
              textDecoration: "none",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
            title={creator}
          >
            by {short(creator, 4)}
          </a>
        )}
      </div>

      {/* VOLUME */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 600, color: "#22c55e" }}>
          {compactUSD(mcapVal ? volumeVal : volumeVal)}
        </div>
        {token.buys !== undefined && token.sells !== undefined && (
          <div style={{ fontSize: 12, marginTop: 2 }}>
            <span style={{ color: "#22c55e" }}>{compactInt(token.buys)}</span> /
            <span style={{ color: "#ef4444" }}>{compactInt(token.sells)}</span>
          </div>
        )}
      </div>

      {/* MARKET CAP */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 600 }}>{compactUSD(mcapVal)}</div>
        <div
          style={{
            fontSize: 12,
            color: prettyPriceUSD(priceVal).startsWith("$0")
              ? "#ef4444"
              : "#22c55e",
          }}
        >
          {prettyPriceUSD(priceVal)}
        </div>
      </div>

      {/* PROGRESS */}
      <div style={{ minWidth: 120, textAlign: "center" }}>
        <ProgressBar
          percent={token.percent ?? 0}
          text={false}
          style={{
            "--track-color": theme.border,
            "--fill-color": "#6366f1",
            width: "100%",
          }}
        />
      </div>

      {/* HOLDERS */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 600 }}>{compactInt(token.holders)}</div>
        <div style={{ fontSize: 12, color: theme.secondary }}>
          {token.holdersPercent ?? 0}%
        </div>
      </div>

      {/* TRADE */}
      <div style={{ textAlign: "center" }}>
        <Button
          color="primary"
          size="small"
          style={{
            background: "linear-gradient(90deg,#3b82f6,#06b6d4)",
            border: "none",
            fontWeight: 600,
            borderRadius: 8,
          }}
        >
          Trade
        </Button>
      </div>
    </div>
  );
};

export default TokenCard;
