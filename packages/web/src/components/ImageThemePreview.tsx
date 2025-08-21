"use client";

import { useEffect, useState } from "react";
import {
  extractColorsFromImage,
  getBestColorScheme,
  REFERENCE_PALETTE_DARK,
  type OkhslColor,
} from "@terminal-tones/theme-generator";
import SyntaxPreview from "@/components/SyntaxPreview";

export default function ImageThemePreview({
  imageUrl,
  idSeed,
  language = "typescript",
}: {
  imageUrl: string;
  idSeed?: string;
  language?: string;
}) {
  const [base16, setBase16] = useState<OkhslColor[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // Prefer fetching as blob to avoid CORS-tainted canvas
        try {
          const resp = await fetch(imageUrl, { mode: "cors" });
          if (resp.ok) {
            const blob = await resp.blob();
            const file = new File([blob], "image", { type: blob.type || "application/octet-stream" });
            const result = await extractColorsFromImage(file, 24);
            if (!cancelled) {
              const colors = result.colors ?? [];
              if (colors.length >= REFERENCE_PALETTE_DARK.length) {
                const theme = getBestColorScheme(colors, REFERENCE_PALETTE_DARK);
                setBase16(theme);
              } else {
                setBase16(null);
              }
              return;
            }
          }
        } catch {
          // fall through to direct URL attempt
        }

        // Fallback: try processing directly from URL (requires CORS-enabled source)
        const result2 = await extractColorsFromImage(imageUrl, 24);
        if (!cancelled) {
          const colors = result2.colors ?? [];
          if (colors.length >= REFERENCE_PALETTE_DARK.length) {
            const theme = getBestColorScheme(colors, REFERENCE_PALETTE_DARK);
            setBase16(theme);
          } else {
            setBase16(null);
          }
        }
      } catch (err) {
        console.warn("ImageThemePreview: failed to extract colors for", imageUrl, err);
        if (!cancelled) setBase16(null);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return (
    <SyntaxPreview okhslBase16={base16 ?? undefined} language={language} idSeed={idSeed} />
  );
}
