// @ts-nocheck

import React from "react";
import { IonPage, IonContent } from "@ionic/react";
import { useTheme } from "../../context/ThemeContext";
import Navbar from "../../components/Navbar/Navbar";
import TokenTable from "../../components/TokenTable/TokenTable";
import TokenList from "../../components/TokenList/TokenList";
import Search from "../../components/Search/Search";
import { useTokens } from "../../hooks/useTokens";
import CreateMemeModal from "../../components/CreateMeme/CreateMemeModal/CreateMemeModal";
import { mockTokens } from "../../moc/mockTokens";
import RewardsSection from "../../components/RewardsSection";

const LS_KEY = "launchpad:main:searchQuery";

const norm = (s?: any) =>
  String(s ?? "")
    .toLowerCase()
    .trim();

const matchesQuery = (t: any, q: string) => {
  if (!q) return true;
  const hay = [t.name, t.symbol, t.ca, t.creator, t.author, t.description]
    .map(norm)
    .join(" ");
  const terms = norm(q).split(/\s+/).filter(Boolean);
  return terms.every((term) => hay.includes(term));
};

const MainPage: React.FC = () => {
  const { theme, darkMode } = useTheme();
  const { tokens } = useTokens();
  const [showCreate, setShowCreate] = React.useState(false);

  const [activeView, setActiveView] = React.useState<
    "home" | "portfolio" | "rewards"
  >("home");

  // ---- search state
  const [query, setQuery] = React.useState<string>("");
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved !== null) setQuery(JSON.parse(saved));
    } catch {}
  }, []);

  const [debounced, setDebounced] = React.useState(query);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(id);
  }, [query]);

  React.useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(debounced));
    } catch {}
  }, [debounced]);

  const filtered = React.useMemo(
    () =>
      Array.isArray(tokens)
        ? tokens.filter((t) => matchesQuery(t, debounced))
        : [],
    [tokens, debounced],
  );
  return (
    <IonPage>
      <IonContent fullscreen>
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: theme.background,
            color: theme.text,
            padding: "20px 16px",
            boxSizing: "border-box",
            transition: "background-color 0.4s ease, color 0.4s ease",
          }}
        >
          <Navbar
            onCreateClick={() => setShowCreate(true)}
            onSelectView={setActiveView}
          />

          {/* ===== PROFILE ===== */}
          {activeView === "home" && (
            <>
              <Search
                value={query}
                onChange={setQuery}
                onClear={() => setQuery("")}
              />
              <TokenTable tokens={filtered} theme={theme} darkMode={darkMode} />
              <TokenList tokens={filtered} theme={theme} darkMode={darkMode} />
            </>
          )}

          {/* ===== PORTFOLIO ===== */}
          {activeView === "portfolio" && (
            <div>
              <h2 style={{ marginBottom: 16 }}>Portfolio</h2>
              <TokenTable
                tokens={mockTokens}
                theme={theme}
                darkMode={darkMode}
              />{" "}
              {/* 👈 моки */}
            </div>
          )}

          {/* ===== REWARDS ===== */}
          {activeView === "rewards" && (
            <RewardsSection theme={theme} darkMode={darkMode} />
          )}

          <style>{`
            @media (max-width: 768px) {
              .desktop-table { display: none !important; }
              .mobile-list { display: flex !important; }
            }
            @media (min-width: 769px) {
              .desktop-table { display: block !important; }
              .mobile-list { display: none !important; }
            }
          `}</style>
        </div>
        <CreateMemeModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default MainPage;
