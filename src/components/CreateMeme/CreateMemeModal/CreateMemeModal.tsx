import React from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
} from "@ionic/react";
import { useCreateMeme } from "../../../hooks/useCreateMeme";
import { useTheme } from "../../../context/ThemeContext";
import CreateMeme from "../CreateMeme";
import { useSolana } from "../../../context/SolanaContext";
import toast from "react-hot-toast";
import { usePrivyAuth } from "../../../context/PrivyContext";

type Props = { isOpen: boolean; onClose: () => void };

const CreateMemeModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { authenticated } = usePrivyAuth();

  const { create, loading, error } = useCreateMeme();
  const { walletState, connectWallet } = useSolana();

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      backdropDismiss={!loading}
      style={
        {
          "--background": theme.background,
          "--box-shadow": "0 12px 32px rgba(0,0,0,.4)",
          "--border-radius": "14px",
          "--backdrop-opacity": "var(--modal-backdrop, .5)",
        } as React.CSSProperties
      }
    >
      <IonHeader>
        <IonToolbar
          style={{ "--background": theme.surface, color: theme.text } as any}
        >
          <IonTitle>Create Meme</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} disabled={loading}>
              Close
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={
          {
            "--background": theme.background,
            color: theme.text,
          } as React.CSSProperties
        }
      >
        <div style={{ maxWidth: 760, margin: "12px auto", padding: 16 }}>
          {/* 👇 новый аплоад */}

          {/* 👇 остальная форма */}
          <CreateMeme
            onSubmit={async (data: any) => {
              if (!authenticated) {
                toast.error("Подключи кошелек");
                await connectWallet();
                return;
              }

              try {
                const { txPayload } = await create({
                  imageBase64: data.image || "",
                  name: data.name,
                  ticker: data.ticker,
                  description: data.description,
                  socials: data.socials,
                  advanced: {
                    buyAmount: data.advanced?.buyAmount, // ← опционально
                  },
                  userPubkey:
                    typeof walletState.publicKey?.toBase58 === "function"
                      ? walletState.publicKey.toBase58()
                      : String(walletState.publicKey || ""),
                });

                console.log("TX payload:", txPayload);
                toast.success(
                  "TX сгенерирован — см. консоль и подпиши транзу.",
                );
                onClose();
              } catch (e) {
                toast.error("Ошибка при генерации транзы");
              }
            }}
          />

          {loading && <div style={{ marginTop: 12 }}>Генерируем…</div>}
          {error && (
            <div style={{ marginTop: 12, color: "#ef4444" }}>
              Ошибка: {error}
            </div>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default CreateMemeModal;
