// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonLabel,
  IonInput,
  IonToast,
  IonLoading,
  IonItem,
  IonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import { wallet, person, logOut, copy as copyIcon } from "ionicons/icons";
import axios from "axios";

import { useSolana } from "../context/SolanaContext";
import { usePrivyAuth } from "../context/PrivyContext";
import { usePrivySolana } from "../hooks/usePrivySolana";
import { shortenAddress } from "../sdk/utils";
import { useTheme } from "../context/ThemeContext";
import "./Tab1.css";

const api = axios.create({
  baseURL: "https://launch.meme/api",
  timeout: 20000,
});

api.defaults.withCredentials = true;

const FIREBASE_TWITTER_URL =
  "https://launch-meme.firebaseapp.com/__/auth/handler?apiKey=AIzaSyCAU3GswYpE2YFplAEHT74XuaDdv080fVs&appName=%5BDEFAULT%5D&authType=signInViaPopup&redirectUrl=https%3A%2F%2Flaunch.meme%2Fprofile&v=11.10.0&eventId=6289270764&providerId=twitter.com";

const TRUSTED_ORIGINS = new Set([
  "https://launch-meme.firebaseapp.com",
  "https://launch.meme",
]);

const Tab1: React.FC = () => {
  const { sdk, walletState, isLoading, error, connectWallet } = useSolana();
  const { logout, authenticated, user } = usePrivyAuth();
  usePrivySolana();
  const { darkMode } = useTheme();

  // Wallet
  const [balance, setBalance] = useState<number>(0);

  // Toast/Loaders
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [xConnecting, setXConnecting] = useState(false);

  // Profile
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [initialProfile, setInitialProfile] = useState<any>(null);

  // OAuth popup
  const popupRef = useRef<Window | null>(null);
  const cleanupRef = useRef<() => void>();

  // UI state
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", !!darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (walletState.connected) fetchBalance();
    else setBalance(0);
  }, [walletState.connected]);

  // авто-инициализация профиля, если уже есть сессия (куки)
  useEffect(() => {
    const walletStr = getWalletStr();
    if (!walletStr) return; // если ещё не подключен кошелёк — ничего не делаем

    const params = new URLSearchParams();
    params.set("wallet", walletStr);

    api
      .post("/profile", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
      .then(({ data }) => {
        console.log(data, "data");
        // data = { wallet, name, telegram, createdAt, updatedAt }
        setProfile(data);
        setInitialProfile(data);
        setName(data?.info?.name || ""); // 👈 сюда из ответа
        setTelegram(data?.info?.telegram || ""); // 👈 сюда из ответа
      })
      .catch(() => {
        console.log("Profile init fetch failed");
      });
  }, [walletState.publicKey]);

  // 🔑 повторный вызов, когда подключился кошелёк

  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current();
      if (popupRef.current && !popupRef.current.closed)
        popupRef.current.close();
    };
  }, []);
  const getWalletStr = () => {
    const pk = walletState?.publicKey as any;
    if (!pk) return "";
    if (typeof pk?.toBase58 === "function") return pk.toBase58(); // Solana PublicKey
    if (typeof pk?.toString === "function") return String(pk.toString());
    return typeof pk === "string" ? pk : "";
  };
  const toast = (m: string) => {
    setToastMessage(m);
    setShowToast(true);
  };

  const fetchBalance = async () => {
    try {
      const lamports = await sdk.wallet.getBalance();
      setBalance(lamports);
    } catch {
      toast("Failed to fetch balance");
    }
  };

  // ---------- COPY ADDRESS ----------
  const handleCopyAddress = async () => {
    const addr = getWalletStr();
    if (!addr) return toast("Connect wallet first");
    try {
      await navigator.clipboard.writeText(addr);
      toast("Address copied");
    } catch {
      toast("Failed to copy");
    }
  };

  // ---------- X (Twitter) connect via Firebase handler ----------
  const handleConnectX = () => {
    setXConnecting(true);
    popupRef.current = window.open(
      FIREBASE_TWITTER_URL,
      "_blank",
      "width=520,height=640,noopener,noreferrer",
    );
    // ✅ всегда отдаёт валидную base58-строку либо ""

    const onMessage = async (event: MessageEvent) => {
      if (!TRUSTED_ORIGINS.has(event.origin)) return;

      try {
        const data = event.data || {};
        const bearerToken =
          data?.credential?.accessToken ||
          data?.credential?.oauthAccessToken ||
          data?.oauthAccessToken ||
          data?.accessToken ||
          data?.token;

        if (data?.type === "X_AUTH_CANCEL" || data?.error) {
          setXConnecting(false);
          if (popupRef.current && !popupRef.current.closed)
            popupRef.current.close();
          return;
        }
        if (bearerToken) {
          await fetchProfile({ token: bearerToken });
          setXConnecting(false);
          if (popupRef.current && !popupRef.current.closed)
            popupRef.current.close();
          return;
        }

        if (popupRef.current) {
          const waitClose = setInterval(async () => {
            if (!popupRef.current || popupRef.current.closed) {
              clearInterval(waitClose);
              setXConnecting(false);
              await fetchProfile({ token: null });
            }
          }, 400);
        }
      } catch {
        setXConnecting(false);
      }
    };

    window.addEventListener("message", onMessage);
    cleanupRef.current = () => window.removeEventListener("message", onMessage);
  };

  // ======= PROFILE FETCH (универсально: с токеном или без) =======
  const fetchProfile = async ({ token }: { token: string | null }) => {
    console.log(token, "token");
    try {
      const cfg = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined;
      const { data } = await api.post("/profile", {}, cfg);
      setProfile(data);
      setInitialProfile(data);
      setName(data?.name || "");
      setTelegram(data?.telegram || "");
      return data;
    } catch (e) {
      // тихо падаем — может не быть сессии
      throw e;
    }
  };

  // ======= “Save data” + ДОП. ЗАПРОС ТОЛЬКО С WALLET =======
  const handleSaveProfile = async () => {
    setSaving(true);
    const walletStr = getWalletStr();
    console.log(walletStr, "walletStr");
    if (!walletStr) {
      toast("Connect wallet first");
      setSaving(false);
      return;
    }

    // 1) основной POST (form-data)
    const fd = new FormData();
    fd.append("name", name || "");
    fd.append("telegram", telegram || "");
    fd.append("wallet", walletStr);
    try {
      await api.post("/profile", fd);
    } catch {
      const params = new URLSearchParams();
      params.set("name", name || "");
      params.set("telegram", telegram || "");
      params.set("wallet", walletStr);
      await api.post("/profile", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
    }

    // 2) повторный POST ТОЛЬКО с wallet (если требуется)
    try {
      const fdWallet = new FormData();
      fdWallet.append("wallet", walletStr);
      const { data } = await api.post("/profile", fdWallet);
      setProfile(data);
      setInitialProfile(data);
      setName(data?.name ?? name);
      setTelegram(data?.telegram ?? telegram);
      toast("Profile saved & refreshed");
    } catch {
      try {
        const p2 = new URLSearchParams();
        p2.set("wallet", walletStr);
        const { data } = await api.post("/profile", p2, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        setProfile(data);
        setInitialProfile(data);
        setName(data?.name ?? name);
        setTelegram(data?.telegram ?? telegram);
        toast("Profile saved & refreshed");
      } catch {
        toast("Saved, but refresh failed");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetProfile = () => {
    if (initialProfile) {
      setName(initialProfile.name || "");
      setTelegram(initialProfile.telegram || "");
    } else {
      setName("");
      setTelegram("");
    }
    toast("Profile reset");
  };

  const balanceInSol = balance / 1_000_000_000;

  return (
    <IonPage>
      <IonContent fullscreen className="wallet-content">
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Wallet</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="wallet-container">
          {/* error banner */}
          {error && (
            <div
              className="connection-banner"
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                borderColor: "rgba(239, 68, 68, 0.25)",
              }}
            >
              <IonText color="danger">
                <p>{error}</p>
              </IonText>
            </div>
          )}

          {/* user card */}
          {authenticated && user?.email?.address && (
            <IonCard className="user-card">
              <IonCardHeader
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <div className="user-avatar">
                  <IonIcon icon={person} />
                </div>
                <div>
                  <IonCardTitle style={{ marginBottom: 4 }}>
                    Welcome back
                  </IonCardTitle>
                  <IonCardSubtitle>{user.email.address}</IonCardSubtitle>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <IonButton
                    fill="clear"
                    color="danger"
                    size="small"
                    onClick={logout}
                  >
                    <IonIcon icon={logOut} />
                  </IonButton>
                </div>
              </IonCardHeader>

              <IonCardContent>
                <IonGrid>
                  <IonRow className="wallet-row">
                    <IonCol size="12" sizeMd="7">
                      <div className="wallet-chip">
                        <span className="chip-label">Address</span>
                        <span
                          className="chip-value"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          {walletState.publicKey
                            ? shortenAddress(walletState.publicKey.toString())
                            : "Not connected"}
                          {walletState.publicKey && (
                            <IonButton
                              size="small"
                              fill="clear"
                              onClick={handleCopyAddress}
                              title="Copy"
                            >
                              <IonIcon icon={copyIcon} />
                            </IonButton>
                          )}
                        </span>
                      </div>
                    </IonCol>
                    <IonCol size="12" sizeMd="5">
                      <div className="wallet-chip">
                        <span className="chip-label">Balance</span>
                        <span className="chip-value">
                          {walletState.connected
                            ? `${balanceInSol.toFixed(4)} SOL`
                            : "—"}
                        </span>
                      </div>
                    </IonCol>
                  </IonRow>

                  {!walletState.connected && (
                    <IonRow>
                      <IonCol>
                        <IonButton
                          expand="block"
                          className="action-button primary"
                          onClick={connectWallet}
                          disabled={isLoading}
                        >
                          <IonIcon icon={wallet} slot="start" />
                          {isLoading ? "Connecting..." : "Connect Wallet"}
                        </IonButton>
                      </IonCol>
                    </IonRow>
                  )}
                </IonGrid>
              </IonCardContent>
            </IonCard>
          )}

          {/* profile card */}
          <IonCard className="profile-card">
            <IonCardHeader>
              <IonCardTitle>Personal profile</IonCardTitle>
              <IonCardSubtitle>Contacts</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <IonButton
                expand="block"
                onClick={handleConnectX}
                disabled={xConnecting}
              >
                {xConnecting ? "Connecting to X..." : "Connect X"}
              </IonButton>

              <IonItem lines="full" style={{ marginTop: 12 }}>
                <IonLabel position="stacked">Name</IonLabel>
                <IonInput
                  value={name}
                  placeholder="e.g. matveyDev"
                  onIonChange={(e) => setName(e.detail.value!)}
                />
              </IonItem>
              <IonItem lines="none" style={{ marginTop: 12 }}>
                <IonLabel position="stacked">Telegram</IonLabel>
                <IonInput
                  value={telegram}
                  placeholder="@nick"
                  onIonChange={(e) => setTelegram(e.detail.value!)}
                />
              </IonItem>

              <div className="profile-actions">
                <IonButton
                  expand="block"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save data"}
                </IonButton>
                <IonButton
                  expand="block"
                  color="medium"
                  onClick={handleResetProfile}
                  disabled={saving}
                >
                  Reset data
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2400}
        />
        <IonLoading isOpen={refreshing} message="Refreshing..." />
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
