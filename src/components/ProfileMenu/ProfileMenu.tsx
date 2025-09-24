// @ts-nocheck
import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { usePrivyAuth } from "../../context/PrivyContext";
import { useHistory } from "react-router-dom";

const ProfileMenu = ({ user, menuOpen, setMenuOpen, onSelectView }: any) => {
  const { theme } = useTheme();
  const { logout } = usePrivyAuth();
  const history = useHistory();

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
          {/* Home */}
          <button
            style={{ padding: 8, background: theme.surface, color: theme.text }}
            onClick={() => {
              onSelectView?.("home");
              setMenuOpen(false);
            }}
          >
            Home
          </button>

          {/* Profile → переход на /tab1 */}
          <button
            style={{ padding: 8, background: theme.surface, color: theme.text }}
            onClick={() => {
              history.push("/tab1"); // переход на страницу профиля
              setMenuOpen(false);
            }}
          >
            Profile
          </button>

          {/* Portfolio */}
          <button
            style={{ padding: 8, background: theme.surface, color: theme.text }}
            onClick={() => {
              onSelectView?.("portfolio");
              setMenuOpen(false);
            }}
          >
            Portfolio
          </button>

          {/* Rewards */}
          <button
            style={{ padding: 8, background: theme.surface, color: theme.text }}
            onClick={() => {
              onSelectView?.("rewards");
              setMenuOpen(false);
            }}
          >
            Rewards
          </button>

          {/* Disconnect */}
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
