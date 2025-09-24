// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";
import { NavBar } from "antd-mobile";
import { BsMoonFill, BsSunFill } from "react-icons/bs";
import { IonButton, IonIcon } from "@ionic/react";
import { addCircleOutline, mail, personCircle } from "ionicons/icons";
import { useTheme } from "../../context/ThemeContext";
import { usePrivyAuth } from "../../context/PrivyContext";
import ProfileMenu from "../ProfileMenu/ProfileMenu";

type NavbarProps = {
  onCreateClick?: () => void;
  onSelectView?: (v: "profile" | "portfolio" | "rewards") => void;
};

const Navbar: React.FC<NavbarProps> = ({ onCreateClick, onSelectView }) => {
  const { theme, darkMode, toggleTheme } = useTheme();
  const { login, authenticated, user, ready } = usePrivyAuth();

  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkWidth = () => setIsMobile(window.innerWidth <= 480);
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // размеры под мобильный/десктоп
  const S = isMobile
    ? {
        barPad: "10px",
        gap: 8,
        btnPad: "6px 10px",
        font: 13,
        icon: 16,
        height: 34,
      }
    : {
        barPad: "16px",
        gap: 10,
        btnPad: "8px 14px",
        font: 14,
        icon: 18,
        height: 36,
      };

  return (
    <NavBar
      style={{
        background: darkMode
          ? "linear-gradient(90deg,#0f172a,#1e293b)"
          : "linear-gradient(90deg,#6366f1,#8b5cf6)",
        color: theme.text,
        borderRadius: 12,
        padding: S.barPad,
        margin: "8px 12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
      back={null}
      right={
        <div style={{ display: "flex", gap: S.gap, alignItems: "center" }}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            type="button"
            style={{
              cursor: "pointer",
              width: S.height,
              height: S.height,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "transparent",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {darkMode ? (
              <BsSunFill color="#fde68a" />
            ) : (
              <BsMoonFill color="#e9d5ff" />
            )}
          </button>

          {/* Create button */}
          <button
            onClick={() => onCreateClick?.()}
            style={{
              cursor: "pointer",
              padding: S.btnPad,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.22)",
              color: theme.text,
              fontSize: S.font,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <IonIcon icon={addCircleOutline} />
            Create Memo
          </button>

          {/* Auth/Profile */}
          {!authenticated && ready && (
            <IonButton
              className="nb__login"
              onClick={login}
              style={
                {
                  "--padding-start": "10px",
                  "--padding-end": "12px",
                  "--border-radius": "12px",
                  height: `${S.height}px`,
                  fontSize: S.font,
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "rgba(255,255,255,0.14)",
                  color: theme.text,
                } as any
              }
            >
              <IonIcon icon={mail} slot="start" />
              Login
            </IonButton>
          )}

          {authenticated && (
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: S.btnPad,
                  height: S.height,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "rgba(255,255,255,0.20)",
                  color: theme.text,
                  fontWeight: 600,
                  fontSize: S.font,
                }}
              >
                <IonIcon icon={personCircle} />
                {!isMobile && (user?.email?.address ?? "Profile")}
              </button>

              {menuOpen && (
                <ProfileMenu
                  user={user}
                  menuOpen={menuOpen}
                  setMenuOpen={setMenuOpen}
                  onSelectView={onSelectView}
                />
              )}
            </div>
          )}
        </div>
      }
    >
      {isMobile ? "🚀" : "🚀 Возьмите-На-Работу.ком"}
    </NavBar>
  );
};

export default Navbar;
