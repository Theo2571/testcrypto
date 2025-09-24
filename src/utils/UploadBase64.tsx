// src/utils/UploadBase64.tsx
import React, { useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const UploadBase64: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : undefined;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string; // "data:image/png;base64,...."
      setPreview(dataUrl);

      // берём только base64 часть после запятой
      const base64 = dataUrl.split(",")[1];

      // metadata нужно превратить в строку, а не объект
      const metadata = JSON.stringify({
        name: file.name,
        description: "Uploaded via UI",
      });

      try {
        setLoading(true);

        const res = await axios.post(
          "/api/upload",
          {
            file: base64,
            metadata, // ← строка
          },
          {
            headers: { "Content-Type": "application/json" },
            validateStatus: () => true,
          },
        );

        if (res.status < 200 || res.status >= 300) {
          const msg =
            res.data?.message ||
            res.data?.error ||
            `Upload failed: ${res.status}`;
          throw new Error(msg);
        }

        const imageUrl = res.data?.imageUrl;
        if (!imageUrl) throw new Error("No imageUrl in response");

        console.log("✅ Upload response:", res.data);
        toast.success("Файл загружен!");
      } catch (err: any) {
        console.error("Ошибка загрузки:", err);
        toast.error(err?.message || "Ошибка при загрузке");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div style={{ padding: 20 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid #ccc",
          background: "#6366f1",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        {loading ? "Загрузка..." : "Выбрать файл"}
      </button>

      {preview && (
        <div style={{ marginTop: 12 }}>
          <img
            src={preview}
            alt="preview"
            style={{ maxWidth: 200, borderRadius: 8 }}
          />
        </div>
      )}
    </div>
  );
};

// @ts-ignore
export default UploadBase64;
