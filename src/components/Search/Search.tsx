// @ts-nocheck
import React from "react";
import { SearchBar } from "antd-mobile";
import { useTheme } from "../../context/ThemeContext";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onClear?: () => void;
}

const Search: React.FC<Props> = ({ value, onChange, onClear }) => {
  const { theme } = useTheme();
  return (
    <div style={{ marginBottom: 16 }}>
      <SearchBar
        value={value}
        placeholder="Поиск "
        onChange={onChange}
        onClear={() => {
          onClear?.();
          onChange("");
        }}
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
