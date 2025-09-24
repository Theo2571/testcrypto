// @ts-nocheck
import React from "react";
import TokenTable from "../TokenTable/TokenTable";
import { mockTokens } from "../../mockTokens";
import { useTheme } from "../../context/ThemeContext";

const PortfolioTable: React.FC = () => {
  const { theme, darkMode } = useTheme();

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 16, color: theme.text }}>Portfolio</h2>
      <TokenTable tokens={mockTokens} darkMode={darkMode} theme={theme} />
    </div>
  );
};

export default PortfolioTable;
