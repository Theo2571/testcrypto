import React, { useMemo, useState, useEffect } from "react";
import { ProgressBar, Tag, Popup } from "antd-mobile";
import { useTheme } from "../../context/ThemeContext";
import { mockTokensPortfolio as DEFAULT } from "../../moc/mockTokens";

const MOBILE_BP = 640;

function useIsMobile() {
  const [w, setW] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );
  useEffect(() => {
    const onR = () => setW(window.innerWidth);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);
  return w < MOBILE_BP;
}

const pctColor = (v: number) =>
  v > 0 ? "#22c55e" : v < 0 ? "#ef4444" : "#94a3b8";

function formatCurrency(n: number, compact = false) {
  if (compact) {
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "K";
  }
  return Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

const Pill = ({ children, color, bg }: any) => (
  <span
    style={{
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      color,
      background: bg,
      border: `1px solid ${color}22`,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

const StatCard = ({
  title,
  value,
  hint,
  accent,
  darkMode,
  theme,
  compact = false,
}: any) => (
  <div
    style={{
      flex: 1,
      minWidth: compact ? 160 : 220,
      padding: compact ? 12 : 16,
      borderRadius: 12,
      border: `1px solid ${theme.border}`,
      background: darkMode
        ? "linear-gradient(135deg,#0b1220,#111827)"
        : "linear-gradient(135deg,#f8fafc,#ffffff)",
      boxShadow: darkMode
        ? "0 2px 12px rgba(0,0,0,0.25)"
        : "0 2px 14px rgba(15,23,42,0.06)",
      display: "flex",
      flexDirection: "column",
      gap: compact ? 4 : 8,
    }}
  >
    <div style={{ fontSize: 12, color: theme.secondary }}>{title}</div>
    <div
      style={{
        fontSize: compact ? 20 : 26,
        fontWeight: 800,
        color: accent || theme.text,
      }}
    >
      {value}
    </div>
    {hint && <div style={{ fontSize: 12, color: theme.secondary }}>{hint}</div>}
  </div>
);

const AllocationRow = ({
  label,
  value,
  pct,
  theme,
  darkMode,
  compact = false,
}: any) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: compact ? "1fr" : "1fr 80px",
      gap: 8,
      alignItems: "center",
    }}
  >
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          marginBottom: 6,
        }}
      >
        <span style={{ color: theme.secondary }}>{label}</span>
        {!compact && (
          <span style={{ color: theme.secondary }}>{pct.toFixed(1)}%</span>
        )}
      </div>
      <ProgressBar
        percent={pct}
        text={false}
        style={{
          "--track-color": darkMode ? "#0b1220" : "#e2e8f0",
          "--fill-color": "#6366f1",
          height: compact ? "6px" : "8px",
          borderRadius: "999px",
        }}
      />
    </div>
    {!compact && (
      <div style={{ textAlign: "right", fontWeight: 700 }}>
        {formatCurrency(value, true)}
      </div>
    )}
  </div>
);

const ActionButton = ({ onClick, label, border, bg, color }: any) => (
  <button
    onClick={onClick}
    style={{
      padding: "9px 12px",
      borderRadius: 10,
      border,
      background: bg,
      color,
      fontWeight: 700,
      cursor: "pointer",
      touchAction: "manipulation",
    }}
  >
    {label}
  </button>
);

const PortfolioTable: React.FC<{ data?: any[] }> = ({ data }) => {
  const { theme, darkMode } = useTheme();
  const isMobile = useIsMobile();

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"value" | "change24h" | "change7d">(
    "value",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  const rows = data && data.length ? data : DEFAULT;

  const computed = useMemo(() => {
    const withValue = rows.map((t: any) => {
      const value = t.balance * t.price;
      const pnlAbs = (t.price - t.costBasis) * t.balance;
      const pnlPct = t.costBasis
        ? ((t.price - t.costBasis) / t.costBasis) * 100
        : 0;
      return { ...t, value, pnlAbs, pnlPct };
    });

    const totalValue = withValue.reduce((s: any, r: any) => s + r.value, 0);
    const dayPnl = withValue.reduce(
      (s: any, r: any) => s + (r.value * r.change24h) / 100,
      0,
    );
    const best = [...withValue].sort((a, b) => b.change24h - a.change24h)[0];
    const worst = [...withValue].sort((a, b) => a.change24h - b.change24h)[0];

    const byCat: Record<string, number> = {};
    for (const r of withValue)
      byCat[r.category] = (byCat[r.category] || 0) + r.value;
    const allocation = Object.entries(byCat)
      .map(([k, v]) => ({ k, v, pct: totalValue ? (v / totalValue) * 100 : 0 }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 6);

    return { withValue, totalValue, dayPnl, best, worst, allocation };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = computed.withValue;
    if (q) {
      arr = arr.filter(
        (t: any) =>
          (t.name || "").toLowerCase().includes(q) ||
          (t.symbol || "").toLowerCase().includes(q) ||
          (t.category || "").toLowerCase().includes(q),
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    arr = [...arr].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      return av === bv ? 0 : av > bv ? dir : -dir;
    });
    return arr;
  }, [computed.withValue, query, sortKey, sortDir]);

  const flipSort = (key: any) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <div
      style={{
        padding: isMobile ? 12 : 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* ===== Header ===== */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: theme.text,
            fontSize: isMobile ? 20 : 24,
            fontWeight: 800,
          }}
        >
          Portfolio
        </h2>
        {!isMobile && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <ActionButton
              label="➕ Deposit"
              onClick={() => alert("Deposit")}
              border="1px solid #22c55e55"
              bg="#22c55e11"
              color="#16a34a"
            />
            <ActionButton
              label="⬇️ Withdraw"
              onClick={() => alert("Withdraw")}
              border="1px solid #60a5fa55"
              bg="#60a5fa11"
              color="#2563eb"
            />
            <ActionButton
              label="⚖️ Rebalance"
              onClick={() => alert("Rebalance")}
              border="1px solid #a78bfa55"
              bg="#a78bfa11"
              color="#7c3aed"
            />
          </div>
        )}
      </div>

      {/* ===== Stats (responsive) ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: 10,
        }}
      >
        <StatCard
          title="Total Value"
          value={formatCurrency(computed.totalValue)}
          hint={isMobile ? "" : "Across all wallets"}
          accent={darkMode ? "#e2e8f0" : "#0f172a"}
          darkMode={darkMode}
          theme={theme}
          compact={isMobile}
        />
        <StatCard
          title="24h P&L"
          value={`${computed.dayPnl >= 0 ? "+" : ""}${formatCurrency(computed.dayPnl)}`}
          hint={isMobile ? "" : "Change since yesterday"}
          accent={pctColor(computed.dayPnl)}
          darkMode={darkMode}
          theme={theme}
          compact={isMobile}
        />
        {!isMobile && (
          <>
            <StatCard
              title="Best 24h"
              value={`${computed?.best?.symbol ?? "-"}  ${computed?.best ? computed.best.change24h.toFixed(2) : "0"}%`}
              hint={computed?.best ? computed.best.name : "—"}
              accent="#22c55e"
              darkMode={darkMode}
              theme={theme}
            />
            <StatCard
              title="Worst 24h"
              value={`${computed?.worst?.symbol ?? "-"}  ${computed?.worst ? computed.worst.change24h.toFixed(2) : "0"}%`}
              hint={computed?.worst ? computed.worst.name : "—"}
              accent="#ef4444"
              darkMode={darkMode}
              theme={theme}
            />
          </>
        )}
      </div>

      {/* ===== Allocation (responsive) ===== */}
      <div
        style={{
          display: "grid",
          gap: 12,
          borderRadius: 12,
          padding: isMobile ? 12 : 16,
          border: `1px solid ${theme.border}`,
          background: darkMode
            ? "linear-gradient(135deg,#0b1220,#0f172a)"
            : "linear-gradient(135deg,#f8fafc,#ffffff)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 800 }}>Allocation</div>
          <Pill color="#6366f1" bg="#6366f111">
            {filtered.length} assets
          </Pill>
          {isMobile && (
            <button
              onClick={() => setShowFilters(true)}
              style={{
                marginLeft: "auto",
                padding: "8px 10px",
                borderRadius: 10,
                border: `1px solid ${theme.border}`,
                background: darkMode ? theme.surface : "#fff",
                color: theme.text,
                fontWeight: 700,
              }}
            >
              Filters
            </button>
          )}
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {computed.allocation.map((a) => (
            <AllocationRow
              key={a.k}
              label={a.k}
              value={a.v}
              pct={a.pct}
              theme={theme}
              darkMode={darkMode}
              compact={isMobile}
            />
          ))}
        </div>
      </div>

      {/* ===== Search + quick pills (stack on mobile) ===== */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          placeholder="Search by name, symbol, tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: "1 1 220px",
            minWidth: isMobile ? "100%" : 220,
            padding: isMobile ? "10px 12px" : "12px 14px",
            borderRadius: 10,
            border: `1px solid ${theme.border}`,
            background: darkMode ? theme.surface : "#fff",
            color: theme.text,
            outline: "none",
          }}
        />
        {!isMobile && (
          <>
            <Pill color="#22c55e" bg="#22c55e11">
              Yield
            </Pill>
            <Pill color="#f59e0b" bg="#f59e0b11">
              New
            </Pill>
            <Pill color="#a855f7" bg="#a855f711">
              DeFi
            </Pill>
          </>
        )}
      </div>

      {/* ===== Desktop table ===== */}
      {!isMobile && (
        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            border: `1px solid ${theme.border}`,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "220px 1fr 1fr 1fr 1fr 140px",
              padding: "12px 16px",
              fontWeight: 800,
              fontSize: 12,
              background: darkMode ? "#0b1220" : "#f1f5f9",
              color: darkMode ? "#cbd5e1" : "#334155",
            }}
          >
            <div>Asset</div>
            <div
              style={{ cursor: "pointer" }}
              onClick={() => flipSort("value")}
            >
              Value {sortKey === "value" ? (sortDir === "asc" ? "▲" : "▼") : ""}
            </div>
            <div>Balance</div>
            <div
              style={{ cursor: "pointer" }}
              onClick={() => flipSort("change24h")}
            >
              24h{" "}
              {sortKey === "change24h" ? (sortDir === "asc" ? "▲" : "▼") : ""}
            </div>
            <div
              style={{ cursor: "pointer" }}
              onClick={() => flipSort("change7d")}
            >
              7d {sortKey === "change7d" ? (sortDir === "asc" ? "▲" : "▼") : ""}
            </div>
            <div style={{ textAlign: "right" }}>Actions</div>
          </div>

          {filtered.map((t: any) => (
            <div
              key={t.id}
              style={{
                display: "grid",
                gridTemplateColumns: "220px 1fr 1fr 1fr 1fr 140px",
                padding: "14px 16px",
                alignItems: "center",
                background: darkMode ? theme.surface : "#fff",
                borderBottom: `1px solid ${theme.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 18,
                    background: darkMode ? "#0b1220" : "#eef2ff",
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  {t.icon || "◼️"}
                </div>
                <div style={{ display: "grid", gap: 2 }}>
                  <div style={{ fontWeight: 800, color: theme.text }}>
                    {t.name}{" "}
                    <span style={{ color: theme.secondary, fontWeight: 600 }}>
                      ({t.symbol})
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                  >
                    <Tag color="primary" fill="outline">
                      {t.category || "Token"}
                    </Tag>
                    <span style={{ fontSize: 12, color: theme.secondary }}>
                      Price {formatCurrency(t.price)}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ fontWeight: 800 }}>{formatCurrency(t.value)}</div>
              <div style={{ color: theme.secondary }}>
                {t.balance.toLocaleString()} {t.symbol}
              </div>
              <div style={{ fontWeight: 700, color: pctColor(t.change24h) }}>
                {t.change24h > 0 ? "+" : ""}
                {t.change24h.toFixed(2)}%
              </div>
              <div style={{ fontWeight: 700, color: pctColor(t.change7d) }}>
                {t.change7d > 0 ? "+" : ""}
                {t.change7d.toFixed(2)}%
              </div>

              <div
                style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
              >
                <ActionButton
                  label="Buy"
                  onClick={() => alert(`Buy ${t.symbol}`)}
                  border="1px solid #22c55e55"
                  bg="#22c55e11"
                  color="#16a34a"
                />
                <ActionButton
                  label="Sell"
                  onClick={() => alert(`Sell ${t.symbol}`)}
                  border="1px solid #ef444455"
                  bg="#ef444411"
                  color="#ef4444"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Mobile cards ===== */}
      {isMobile && (
        <div style={{ display: "grid", gap: 10 }}>
          {filtered.map((t: any) => (
            <div
              key={t.id}
              style={{
                borderRadius: 12,
                border: `1px solid ${theme.border}`,
                background: darkMode ? theme.surface : "#fff",
                padding: 12,
                display: "grid",
                gap: 10,
              }}
            >
              {/* row 1: icon + names + tag */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 18,
                    background: darkMode ? "#0b1220" : "#eef2ff",
                    border: `1px solid ${theme.border}`,
                    flex: "0 0 auto",
                  }}
                >
                  {t.icon || "◼️"}
                </div>
                <div style={{ display: "grid", gap: 2 }}>
                  <div style={{ fontWeight: 800, color: theme.text }}>
                    {t.name}{" "}
                    <span style={{ color: theme.secondary, fontWeight: 600 }}>
                      ({t.symbol})
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                  >
                    <Tag
                      color="primary"
                      fill="outline"
                      style={{
                        transform: "scale(0.9)",
                        transformOrigin: "left",
                      }}
                    >
                      {t.category || "Token"}
                    </Tag>
                  </div>
                </div>
                <div style={{ marginLeft: "auto", fontWeight: 800 }}>
                  {formatCurrency(t.balance * t.price, true)}
                </div>
              </div>

              {/* row 2: price & balance */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: theme.secondary,
                  fontSize: 12,
                }}
              >
                <span>Price {formatCurrency(t.price)}</span>
                <span>
                  {t.balance.toLocaleString()} {t.symbol}
                </span>
              </div>

              {/* row 3: 24h/7d bars */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <div style={{ display: "grid", gap: 6 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                    }}
                  >
                    <span>24h</span>
                    <b style={{ color: pctColor(t.change24h) }}>
                      {t.change24h > 0 ? "+" : ""}
                      {t.change24h.toFixed(2)}%
                    </b>
                  </div>
                  <ProgressBar
                    percent={Math.min(100, Math.abs(t.change24h) * 4)}
                    text={false}
                    style={{
                      "--track-color": darkMode ? "#09101a" : "#e2e8f0",
                      "--fill-color": pctColor(t.change24h),
                      height: "8px",
                      borderRadius: "999px",
                    }}
                  />
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                    }}
                  >
                    <span>7d</span>
                    <b style={{ color: pctColor(t.change7d) }}>
                      {t.change7d > 0 ? "+" : ""}
                      {t.change7d.toFixed(2)}%
                    </b>
                  </div>
                  <ProgressBar
                    percent={Math.min(100, Math.abs(t.change7d) * 2)}
                    text={false}
                    style={{
                      "--track-color": darkMode ? "#09101a" : "#e2e8f0",
                      "--fill-color": pctColor(t.change7d),
                      height: "8px",
                      borderRadius: "999px",
                    }}
                  />
                </div>
              </div>

              {/* row 4: actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <ActionButton
                  label="Buy"
                  onClick={() => alert(`Buy ${t.symbol}`)}
                  border="1px solid #22c55e55"
                  bg="#22c55e11"
                  color="#16a34a"
                />
                <ActionButton
                  label="Sell"
                  onClick={() => alert(`Sell ${t.symbol}`)}
                  border="1px solid #ef444455"
                  bg="#ef444411"
                  color="#ef4444"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile filters popup (пример) */}
      <Popup
        visible={showFilters}
        onMaskClick={() => setShowFilters(false)}
        bodyStyle={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
      >
        <div style={{ padding: 16, display: "grid", gap: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Quick Filters</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Pill color="#22c55e" bg="#22c55e11">
              Yield
            </Pill>
            <Pill color="#f59e0b" bg="#f59e0b11">
              New
            </Pill>
            <Pill color="#a855f7" bg="#a855f711">
              DeFi
            </Pill>
          </div>
          <button
            onClick={() => setShowFilters(false)}
            style={{
              marginTop: 8,
              padding: "12px 14px",
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              background: darkMode ? theme.surface : "#fff",
              fontWeight: 700,
              color: theme.text,
            }}
          >
            Done
          </button>
        </div>
      </Popup>
    </div>
  );
};

export default PortfolioTable;
