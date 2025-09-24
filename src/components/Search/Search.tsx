// @ts-nocheck
import React from "react";
import { SearchBar } from "antd-mobile";
import { useTheme } from "../../context/ThemeContext";

const Search: React.FC = () => {
  const { theme } = useTheme();
  return (
    <div style={{ marginBottom: 16 }}>
      <SearchBar
        placeholder="Search tokens..."
        style={{
          "--background": theme.surface,
          "--placeholder-color": theme.secondary,
          color: theme.text,
          borderRadius: 12,
          width: "250px",
        }}
      />
    </div>
  );
};

export default Search;
