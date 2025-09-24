// @ts-nocheck
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
} from "react";

export interface Theme {
  background: string;
  surface: string;
  text: string;
  secondary: string;
  border: string;
}

const darkTheme: Theme = {
  background: "#0f111a",
  surface: "#1a1d2b",
  text: "#f3f4f6",
  secondary: "#9ca3af",
  border: "#2a2d3c",
};

const lightTheme: Theme = {
  background: "#f5f5f5",
  surface: "#fff",
  text: "#111",
  secondary: "#555",
  border: "#ddd",
};

interface ThemeContextType {
  theme: Theme;
  darkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const LS_KEY = "isDarkMode";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // старт: localStorage → иначе системная тема → иначе true
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
  });

  const toggleTheme = () => setDarkMode((prev) => !prev);

  // сохраняем в localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(darkMode));
    } catch {}
  }, [darkMode]);

  // (опц.) атрибут на html для CSS: [data-theme="dark"|"light"]
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // (опц.) реагируем на смену системной темы
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => {
      // меняем только если пользователь явно не кликал?
      // если нужно — убери условие и просто setDarkMode(e.matches)
      // здесь без эвристик: не трогаем пользовательский выбор
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const value = useMemo<ThemeContextType>(
    () => ({
      theme: darkMode ? darkTheme : lightTheme,
      darkMode,
      toggleTheme,
    }),
    [darkMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
