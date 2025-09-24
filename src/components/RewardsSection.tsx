// @ts-nocheck

import React from "react";
import { ProgressBar } from "antd-mobile";
import { mockRewards } from "../moc/mockTokens";

const RewardsSection = ({ theme, darkMode }: any) => {
  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Rewards</h2>

      {/* Суммарные баллы */}
      <div
        style={{
          padding: 20,
          borderRadius: 12,
          background: darkMode
            ? "linear-gradient(90deg,#1e293b,#0f172a)"
            : "linear-gradient(90deg,#e0f2fe,#f0f9ff)",
          marginBottom: 20,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600 }}>Your Points</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: "#3b82f6" }}>
          {mockRewards.reduce(
            (sum, r) => sum + (r.status === "Completed" ? r.points : 0),
            0,
          )}{" "}
          pts
        </div>
        <ProgressBar
          percent={65}
          text={false}
          style={{
            "--track-color": theme.border,
            "--fill-color": "#22c55e",
            height: "10px",
            borderRadius: "8px",
          }}
        />
        <div style={{ fontSize: 12, color: theme.secondary }}>
          Progress to next level
        </div>
      </div>

      {/* Таблица наград */}
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          border: `1px solid ${theme.border}`,
        }}
      >
        {/* Заголовки */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "50px 2fr 1fr 1fr 1fr",
            padding: "12px 16px",
            fontWeight: 700,
            fontSize: 13,
            background: darkMode ? "#1e293b" : "#f1f5f9",
            color: darkMode ? "#cbd5e1" : "#334155",
          }}
        >
          <div> </div>
          <div>Reward</div>
          <div style={{ textAlign: "center" }}>Points</div>
          <div style={{ textAlign: "center" }}>Date</div>
          <div style={{ textAlign: "center" }}>Status</div>
        </div>

        {/* Список */}
        {mockRewards.map((r) => (
          <div
            key={r.id}
            style={{
              display: "grid",
              gridTemplateColumns: "50px 2fr 1fr 1fr 1fr",
              padding: "12px 16px",
              alignItems: "center",
              backgroundColor: darkMode ? theme.surface : "#fff",
              borderBottom: `1px solid ${theme.border}`,
            }}
          >
            <div style={{ fontSize: 20 }}>{r.icon}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: theme.secondary }}>
                {r.description}
              </div>
            </div>
            <div style={{ textAlign: "center", fontWeight: 600 }}>
              {r.points}
            </div>
            <div style={{ textAlign: "center", fontSize: 12 }}>{r.date}</div>
            <div
              style={{
                textAlign: "center",
                color:
                  r.status === "Completed"
                    ? "#22c55e"
                    : r.status === "In Progress"
                      ? "#f59e0b"
                      : "#94a3b8",
                fontWeight: 600,
              }}
            >
              {r.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RewardsSection;
