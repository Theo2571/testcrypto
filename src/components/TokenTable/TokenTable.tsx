// @ts-nocheck
import React from "react";
import TokenCard from "../../components/TokenCard/TokenCard";
import { useTheme } from "../../context/ThemeContext";

const TokenTable = ({ tokens }) => {
  const { darkMode } = useTheme();

  return (
    <div className="desktop-table">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 1.5fr 1fr 1fr 1fr 1fr auto",
          padding: "12px 16px",
          background: darkMode
            ? "linear-gradient(90deg, #1e293b, #0f172a)"
            : "linear-gradient(90deg, #f1f5f9, #e2e8f0)",
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        <div>TOKEN</div>
        <div>CA</div>
        <div style={{ textAlign: "center" }}>VOLUME</div>
        <div style={{ textAlign: "center" }}>MARKET CAP</div>
        <div style={{ textAlign: "center" }}>PROGRESS</div>
        <div style={{ textAlign: "center" }}># HOLDERS</div>
        <div style={{ textAlign: "center" }}>TRADE</div>
      </div>

      <div>
        {tokens.map((t, i) => (
          <TokenCard key={i} token={t} />
        ))}
      </div>
    </div>
  );
};

export default TokenTable;
