// src/components/CreateMeme/CreateMeme.tsx
// @ts-nocheck
import React from "react";
import { IonContent, IonPage } from "@ionic/react";
import { useTheme } from "../../context/ThemeContext";

type MemeForm = {
  image?: File | null;
  name: string;
  ticker: string;
  description: string;
  socials: {
    discord?: string;
    telegram?: string;
    twitter?: string;
    website?: string;
  };
  advanced: { buyAmount?: string };
};

type CreateMemeProps = {
  onSubmit?: (data: MemeForm) => void;
  maxImageMb?: number; // default 5
};

const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/svg+xml"];

const formatBytes = (bytes: number) => {
  if (!bytes && bytes !== 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0,
    b = bytes;
  while (b >= 1024 && i < units.length - 1) {
    b /= 1024;
    i++;
  }
  return `${b.toFixed(b < 10 ? 2 : 1)} ${units[i]}`;
};

const inputStyle = (theme: any): React.CSSProperties => ({
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: `1px solid ${theme.border}`,
  background: theme.surface,
  color: theme.text,
  outline: "none",
});

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
  marginBottom: 6,
};
const errorText = (msg?: string) =>
  msg ? (
    <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{msg}</div>
  ) : null;

/* ---------- Accordion Section ---------- */
const Section: React.FC<{
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  subtitle?: string;
}> = ({ title, open, onToggle, children, subtitle }) => {
  const { theme } = useTheme(); // используем тему тут
  const chevron = open ? "▲" : "▼";
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="cm__section-toggle"
        style={{
          width: "100%",
          textAlign: "left",
          padding: "14px 16px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          background: "transparent",
          border: "none",
          color: theme.text, // явный цвет заголовка
        }}
      >
        <span>
          {title}
          {subtitle ? (
            <span
              style={{ fontWeight: 400, color: theme.secondary, marginLeft: 8 }}
            >
              {subtitle}
            </span>
          ) : null}
        </span>
        <span style={{ color: theme.secondary }}>{chevron}</span>{" "}
        {/* видимая стрелка */}
      </button>

      <div
        style={{
          maxHeight: open ? 1200 : 0,
          transition: "max-height 220ms ease",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "0 16px 16px 16px" }}>{children}</div>
      </div>
    </div>
  );
};
/* -------------------------------------- */

const CreateMeme: React.FC<CreateMemeProps> = ({
  onSubmit,
  maxImageMb = 5,
}) => {
  const { theme } = useTheme();
  const primary = (theme as any).primary ?? "#6366f1";

  const [basicOpen, setBasicOpen] = React.useState(true);
  const [socialOpen, setSocialOpen] = React.useState(false);
  const [advOpen, setAdvOpen] = React.useState(false);

  const [imageError, setImageError] = React.useState<string | null>(null);
  const [image, setImage] = React.useState<string | null>(null); // вместо File храним base64
  const [preview, setPreview] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [ticker, setTicker] = React.useState("");
  const [description, setDescription] = React.useState("");

  const [discord, setDiscord] = React.useState("");
  const [telegram, setTelegram] = React.useState("");
  const [twitter, setTwitter] = React.useState("");
  const [website, setWebsite] = React.useState("");

  const [buyAmount, setBuyAmount] = React.useState("");

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const firstErrorRef = React.useRef<HTMLDivElement | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dropRef = React.useRef<HTMLDivElement>(null);

  const maxBytes = maxImageMb * 1024 * 1024;

  const isEmpty = (s: string) => !s || !s.trim();
  const validateUrl = (value: string, domains?: string[]) => {
    if (isEmpty(value)) return "";
    try {
      const u = new URL(value);
      if (!/^https?:$/i.test(u.protocol)) return "Only http(s) is allowed.";
      if (domains && !domains.some((d) => u.hostname.endsWith(d)))
        return `Domain must be: ${domains.join(", ")}`;
      return "";
    } catch {
      return "Invalid URL.";
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!image) next.image = "Image is required.";
    if (isEmpty(name)) next.name = "Name is required.";
    else if (name.trim().length < 2 || name.trim().length > 40)
      next.name = "Name length must be 2–40 chars.";
    const t = ticker.trim();
    if (isEmpty(t)) next.ticker = "Ticker is required.";
    else if (!/^[A-Za-z][A-Za-z0-9]{1,7}$/.test(t))
      next.ticker = "Ticker: start with a letter, 2–8 chars, A–Z0–9.";
    if (description && description.trim().length > 280)
      next.description = "Max 280 characters.";
    const dErr = validateUrl(discord, ["discord.com", "discord.gg"]);
    if (dErr) next.discord = dErr;
    const tgErr = validateUrl(telegram, ["t.me", "telegram.me"]);
    if (tgErr) next.telegram = tgErr;
    const twErr = validateUrl(twitter, ["x.com", "twitter.com"]);
    if (twErr) next.twitter = twErr;
    const wErr = validateUrl(website);
    if (wErr) next.website = wErr;
    if (!isEmpty(buyAmount)) {
      const n = Number(buyAmount);
      if (!isFinite(n) || n < 0)
        next.buyAmount = "Enter a non-negative number.";
    }
    setErrors(next);
    if (Object.keys(next).length) {
      setTimeout(
        () =>
          firstErrorRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        0,
      );
      return false;
    }
    return true;
  };

  const validateAndSetImage = (file: File) => {
    setImageError(null);

    if (!allowedTypes.includes(file.type)) {
      setImage(null);
      setPreview(null);
      setImageError("Allowed: JPG, PNG, GIF, SVG.");
      return;
    }
    if (file.size > maxBytes) {
      setImage(null);
      setPreview(null);
      setImageError(`Max file size is ${maxImageMb} MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImage(base64); // сохраняем строку
      setPreview(base64); // используем её же для preview
      clearError("image");
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) validateAndSetImage(f);
  };

  // Drag & Drop
  React.useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const prevent = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onDrop = (e: DragEvent) => {
      prevent(e);
      const f = e.dataTransfer?.files?.[0];
      if (f) validateAndSetImage(f);
    };
    const onDragOver = (e: DragEvent) => {
      prevent(e);
      el.style.borderColor = (theme as any).primary ?? "#6366f1";
    };
    const onDragLeave = (e: DragEvent) => {
      prevent(e);
      el.style.borderColor = theme.border;
    };

    el.addEventListener("dragover", onDragOver);
    el.addEventListener("dragleave", onDragLeave);
    el.addEventListener("drop", onDrop);
    ["dragenter", "dragover", "dragleave", "drop"].forEach((t) =>
      document.addEventListener(t, prevent),
    );
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("dragleave", onDragLeave);
      el.removeEventListener("drop", onDrop);
      ["dragenter", "dragover", "dragleave", "drop"].forEach((t) =>
        document.removeEventListener(t, prevent),
      );
    };
  }, [theme]);

  const handleRemoveImage = () => {
    setImage(null);
    setPreview(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: MemeForm = {
      image, // тут уже base64 строка!
      name: name.trim(),
      ticker: ticker.trim().toUpperCase(),
      description: description.trim(),
      socials: {
        discord: discord.trim() || undefined,
        telegram: telegram.trim() || undefined,
        twitter: twitter.trim() || undefined,
        website: website.trim() || undefined,
      },
      advanced: { buyAmount: buyAmount.trim() || undefined },
    };
    onSubmit?.(payload);
  };

  const onTickerChange = (v: string) => {
    const cleaned = v.replace(/\$/g, "").replace(/\s+/g, "").toUpperCase();
    setTicker(cleaned.slice(0, 8));
  };
  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!(field in prev)) return prev; // если ошибки нет
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };
  return (
    <IonPage>
      <IonContent
        fullscreen
        style={
          {
            "--background": theme.background,
            color: theme.text,
          } as React.CSSProperties
        }
      >
        <form
          onSubmit={submit}
          className="cm"
          style={{
            maxWidth: 680,
            margin: "0 auto",
            padding: 16,
            background: "transparent",
            color: theme.text,
          }}
        >
          {/* Upload */}
          <div
            ref={dropRef}
            style={{
              border: `1px dashed ${theme.border}`,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              marginTop: 55,
              background: theme.surface,
            }}
          >
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  Upload an image{" "}
                  <span style={{ opacity: 0.6, fontWeight: 400 }}>
                    (required)
                  </span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
                  Drag&drop here or click the button. Allowed: JPG, PNG, GIF,
                  SVG. Max size: {maxImageMb} Mb.
                </div>

                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "none",
                      background: primary,
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Select the file
                  </button>

                  {image ? (
                    <div style={{ fontSize: 12 }}>
                      <div style={{ opacity: 0.8 }}>
                        {image.name} • {formatBytes(image.size)}
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: theme.secondary,
                          textDecoration: "underline",
                          cursor: "pointer",
                          padding: 0,
                          marginTop: 2,
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      No file selected
                    </div>
                  )}
                </div>

                {(imageError || errors.image) && (
                  <div
                    ref={firstErrorRef}
                    style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}
                  >
                    {imageError || errors.image}
                  </div>
                )}
              </div>

              <div
                style={{
                  width: 140,
                  minHeight: 100,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  background: theme.background,
                }}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 12, opacity: 0.6 }}>Preview</span>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.svg,image/jpeg,image/png,image/gif,image/svg+xml"
              style={{ display: "none" }}
              onChange={onFileChange}
            />
          </div>

          {/* Sections */}
          <Section
            title="1. Basic data"
            subtitle="Immutable after mint"
            open={basicOpen}
            onToggle={() => setBasicOpen((v) => !v)}
          >
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={labelStyle}>Name *</div>
                <input
                  placeholder="Name"
                  style={inputStyle(theme)}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);

                    // 💡 проверяем прямо здесь
                    if (errors.name && e.target.value.trim().length >= 2) {
                      setErrors((prev) => {
                        const { name, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                />
                {errorText(errors.name)}
              </div>

              <div>
                <div style={labelStyle}>Ticker *</div>
                <input
                  placeholder="Ticker"
                  style={inputStyle(theme)}
                  value={ticker}
                  onChange={(e) => {
                    setTicker(e.target.value);
                    clearError("ticker"); // ошибка сразу уберётся
                  }}
                />
                {errorText(errors.ticker)}
              </div>

              <div>
                <div style={labelStyle}>Description (optional, ≤ 280)</div>
                <textarea
                  placeholder="Description"
                  rows={4}
                  style={{ ...inputStyle(theme), resize: "vertical" }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                {errorText(errors.description)}
              </div>
            </div>
          </Section>

          <Section
            title="2. Social optional data"
            open={socialOpen}
            onToggle={() => setSocialOpen((v) => !v)}
          >
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={labelStyle}>Discord link</div>
                <input
                  placeholder="https://discord.gg/..."
                  style={inputStyle(theme)}
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                />
                {errorText(errors.discord)}
              </div>
              <div>
                <div style={labelStyle}>Telegram link</div>
                <input
                  placeholder="https://t.me/..."
                  style={inputStyle(theme)}
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                />
                {errorText(errors.telegram)}
              </div>
              <div>
                <div style={labelStyle}>Twitter (X) link</div>
                <input
                  placeholder="https://x.com/..."
                  style={inputStyle(theme)}
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                />
                {errorText(errors.twitter)}
              </div>
              <div>
                <div style={labelStyle}>Website link</div>
                <input
                  placeholder="https://..."
                  style={inputStyle(theme)}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
                {errorText(errors.website)}
              </div>
            </div>
          </Section>

          <Section
            title="3. Advanced"
            open={advOpen}
            onToggle={() => setAdvOpen((v) => !v)}
          >
            <div>
              <div style={labelStyle}>Buy amount</div>
              <input
                placeholder="e.g. 0.5 SOL"
                style={inputStyle(theme)}
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
              />
              {errorText(errors.buyAmount)}
            </div>
          </Section>

          <button
            type="submit"
            disabled={Object.keys(errors).length > 0}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: "none",
              background: primary,
              opacity: Object.keys(errors).length > 0 ? 0.8 : 1,
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 8,
            }}
          >
            Create meme
          </button>

          {/* локальные стили для плейсхолдеров/кнопок секций */}
          <style>{`
            .cm input::placeholder,
            .cm textarea::placeholder {
              color: ${theme.secondary};
              opacity: 0.9;
            }
            /* на всякий для Safari/Chromium, чтобы текст точно был темой */
            .cm .cm__section-toggle { -webkit-text-fill-color: ${theme.text}; }
          `}</style>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default CreateMeme;
