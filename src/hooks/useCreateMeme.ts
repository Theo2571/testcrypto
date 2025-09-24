// src/hooks/useCreateMeme.ts
// @ts-nocheck
import { useState, useCallback } from "react";
import {
  uploadImageJSON,
  createMetadata,
  generateTokenTx,
} from "../api/launchMeme";

/** File -> dataURL */
export const fileToDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

export function useCreateMeme() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (form: {
      imageBase64?: string | null;
      image?: File | null;
      name: string;
      ticker: string;
      description?: string;
      socials?: {
        discord?: string;
        telegram?: string;
        twitter?: string;
        website?: string;
      };
      advanced?: {
        buyAmount?: number | string; // опционально, для firstBuyAmount
      };
      userPubkey: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        // 1) Получаем dataURL
        let dataURL = form.imageBase64 ?? null;
        if (!dataURL && form.image) dataURL = await fileToDataURL(form.image);
        if (!dataURL) throw new Error("Attach an image first");

        // 2) upload -> imageUrl (JSON-вариант через общую функцию)
        const { imageUrl } = await uploadImageJSON({
          imageBase64: dataURL,
          name: form.name,
          ticker: form.ticker,
          description: form.description,
          socials: form.socials,
        });

        // 3) metadata -> metadataUri (без advanced-полей)
        const { metadataUri } = await createMetadata({
          name: form.name,
          symbol: form.ticker,
          description: form.description,
          image: imageUrl,
          discord: form.socials?.discord,
          telegram: form.socials?.telegram,
          twitter: form.socials?.twitter,
          website: form.socials?.website,
        });
        if (!metadataUri) throw new Error("No metadataUri returned");

        // 4) tx payload (новая сигнатура: name/symbol)
        const txPayload = await generateTokenTx({
          name: form.name,
          symbol: form.ticker,
          metadataUri,
          userPubkey: form.userPubkey,
          firstBuyAmount:
            form.advanced?.buyAmount != null
              ? Number(form.advanced.buyAmount) || 0
              : undefined,
        });

        return { imageUrl, metadataUri, txPayload };
      } catch (e: any) {
        setError(e?.message || "Failed to create meme");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { create, loading, error };
}
