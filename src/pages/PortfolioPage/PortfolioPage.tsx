// @ts-nocheck
import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { usePrivyAuth } from "../../context/PrivyContext";

const ProfileMenu = ({ user, menuOpen, setMenuOpen, onSelectView }: any) => {
  const { theme } = useTheme();
  const { logout } = usePrivyAuth();

  return (
    <div style={{ position: "relative" }}>
      {menuOpen && (
        <div
          style={{
            position: "absolute",
            top: "120%",
            right: 0,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: 8,
            display: "flex",
            flexDirection: "column",
            minWidth: 160,
            zIndex: 1000,
          }}
        >
          <button
            style={{ padding: 8, background: theme.surface, color: theme.text }}
            onClick={() => {
              onSelectView?.("profile");
              setMenuOpen(false);
            }}
          >
            Profile
          </button>

          <button
            style={{ padding: 8, background: theme.surface, color: theme.text }}
            onClick={() => {
              onSelectView?.("portfolio");
              setMenuOpen(false);
            }}
          >
            Portfolio
          </button>

          <button
            style={{ padding: 8, background: theme.surface, color: theme.text }}
            onClick={() => {
              onSelectView?.("rewards");
              setMenuOpen(false);
            }}
          >
            Rewards
          </button>

          <button
            style={{ padding: 8, color: "red", background: theme.surface }}
            onClick={logout}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
