// @ts-nocheck
import React from "react";
import { SearchBar } from "antd-mobile";
import { useTheme } from "../../context/ThemeContext";
import { FiSearch } from "react-icons/fi";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onClear?: () => void;
}

const Search: React.FC<Props> = ({ value, onChange, onClear }) => {
  const { theme, darkMode } = useTheme();

  return (
    <div
      style={{
        margin: "12px auto 20px",
        display: "flex",
        width: "100%",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
        }}
      >
        <SearchBar
          value={value}
          placeholder="Поиск токенов..."
          onChange={onChange}
          onClear={() => {
            onClear?.();
            onChange("");
          }}
          style={{
            "--background": darkMode
              ? "rgba(30,41,59,0.8)"
              : "rgba(241,245,249,0.8)",
            "--placeholder-color": theme.secondary,
            color: theme.text,
            borderRadius: 14,
            boxShadow: darkMode
              ? "0 2px 6px rgba(0,0,0,0.4)"
              : "0 2px 6px rgba(0,0,0,0.1)",
            transition: "all 0.25s ease",
            width: "100%",
          }}
        />
      </div>
    </div>
  );
};

export default Search;
