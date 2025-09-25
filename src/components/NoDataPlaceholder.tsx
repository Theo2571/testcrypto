// @ts-nocheck
import React from "react";
import { Button } from "antd-mobile";

const NoDataPlaceholder: React.FC<{ darkMode: boolean; theme: any }> = ({
  darkMode,
  theme,
}) => {
  return (
    <div
      style={{
        padding: 40,
        textAlign: "center",
        borderRadius: 16,
        background: darkMode
          ? "linear-gradient(135deg,#0f172a,#1e293b)"
          : "linear-gradient(135deg,#f0f9ff,#e0f2fe)",
        color: theme.text,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        animation: "fadeIn 1s ease",

        boxShadow: darkMode
          ? "0 6px 18px rgba(0,0,0,0.4)"
          : "0 6px 18px rgba(0,0,0,0.1)",
        backdropFilter: "blur(6px)",
      }}
    >
      {/* Иллюстрация/эмоджи */}
      <div
        style={{
          fontSize: 64,
          animation: "float 3s ease-in-out infinite",
          filter: darkMode ? "drop-shadow(0 0 6px rgba(59,130,246,0.5))" : "",
        }}
      >
        🚀
      </div>

      {/* Сообщение */}
      <div style={{ maxWidth: 320 }}>
        <h3 style={{ margin: 0, fontWeight: 700 }}>Пока нет токенов</h3>
        <p style={{ marginTop: 8, fontSize: 14, color: theme.secondary }}>
          Создай свой мем-токен или подключи кошелёк, чтобы увидеть список.
        </p>
      </div>

      {/* Кнопка действия */}

      {/* Подсказка */}
      <div style={{ marginTop: 16, fontSize: 12, color: theme.secondary }}>
        🌐 Данные появятся автоматически после загрузки или по WebSocket
      </div>

      {/* CSS анимации */}
      <style>
        {`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        `}
      </style>
    </div>
  );
};

export default NoDataPlaceholder;
