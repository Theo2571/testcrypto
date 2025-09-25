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
  mode?: "strict" | "creative";
};

const Navbar: React.FC<NavbarProps> = ({
  onCreateClick,
  onSelectView,
  mode = "strict",
}) => {
  const { darkMode, toggleTheme } = useTheme();
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
        gap: 12,
        btnPad: "8px 14px",
        font: 14,
        icon: 18,
        height: 38,
      };

  const textColor = mode === "strict" ? "rgba(241,245,249,0.95)" : "#a7f3d0";

  const gradientText: React.CSSProperties =
    mode === "creative"
      ? {
          background: "linear-gradient(90deg,#fff,#e0f2fe)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: 700,
        }
      : { color: textColor, fontWeight: 700 };

  return (
    <NavBar
      style={{
        position: "relative", // 👈 чтобы absolute у меню работал относительно NavBar
        zIndex: 1000, // 👈 выше большинства компонентов
        background: darkMode
          ? "linear-gradient(90deg,#0f172a,#1e293b)"
          : "linear-gradient(90deg,#6366f1,#8b5cf6)",
        color: textColor,
        borderRadius: 14,
        padding: S.barPad,

        margin: "8px 0px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backdropFilter: "blur(12px)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        height: 65,
      }}
      back={null}
      left={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* 🚀 в круге */}
          <div
            style={{
              width: isMobile ? 28 : 36,
              height: isMobile ? 28 : 36,
              borderRadius: "50%",
              background: darkMode
                ? "linear-gradient(135deg,#06b6d4,#3b82f6)" // 🌑 тёмная
                : "linear-gradient(135deg,#3b82f6,#60a5fa)", // ☀️ светлая
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: isMobile ? 16 : 20,
            }}
          >
            🚀
          </div>

          {/* Двухстрочный текст */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.1,
            }}
          >
            <span
              style={{
                fontSize: isMobile ? 15 : 18,
                fontWeight: 600,

                textShadow: darkMode
                  ? "0 0 6px rgba(34,197,94,0.6)"
                  : "0 0 4px rgba(14,165,233,0.5)", // чуть легче в светлой
              }}
            >
              Возьмите-На-
            </span>
            <span
              style={{
                fontSize: isMobile ? 16 : 26,
                fontWeight: 800,

                textTransform: "uppercase",
                letterSpacing: "1px",
                textShadow: darkMode
                  ? "0 0 8px rgba(236,72,153,0.7)"
                  : "0 0 6px rgba(192,132,252,0.6)",
              }}
            >
              Работу.ком
            </span>
          </div>
        </div>
      }
      right={
        <div
          style={{ display: "flex", gap: S.gap, justifyContent: "flex-end" }}
        >
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
              background: "rgba(255,255,255,0.08)",
              color: textColor,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {darkMode ? <BsSunFill /> : <BsMoonFill />}
          </button>

          {/* Create button */}
          <button
            onClick={() => onCreateClick?.()}
            style={{
              cursor: "pointer",
              padding: S.btnPad,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.18)",
              fontSize: S.font,
              color: textColor,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <IonIcon icon={addCircleOutline} />
            {!isMobile && "Create Meme"}
          </button>

          {/* Auth/Profile */}
          {!authenticated && ready && (
            <button
              onClick={login}
              style={{
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: S.btnPad,
                height: S.height,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(59,130,246,0.9)", // яркая кнопка
                color: "#fff",
                fontSize: S.font,
                fontWeight: 600,
                boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                transition: "all 0.2s ease",
              }}
            >
              <IonIcon icon={mail} style={{ fontSize: S.icon }} />
              {!isMobile && "Login"}
            </button>
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
                  color: textColor,
                  fontWeight: 600,
                  fontSize: S.font,
                  maxWidth: isMobile ? 44 : 220,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <IonIcon icon={personCircle} />
                {!isMobile && (user?.email?.address ?? "Profile")}
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    zIndex: 9999, // 👈 приоритет поверх всего
                    animation: "fadeInScale 0.2s ease",
                  }}
                >
                  <ProfileMenu
                    user={user}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    onSelectView={onSelectView}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      }
    />
  );
};

export default Navbar;
