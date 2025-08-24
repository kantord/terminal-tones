"use client";

import { useEffect, useState } from "react";
import type { OkhslColor } from "@terminal-tones/theme-generator";
import { extractColorsFromImage, getBestColorScheme, REFERENCE_PALETTE_DARK } from "@terminal-tones/theme-generator";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setError(null);
        setBase16(null);
        const result = await extractColorsFromImage(imageUrl, 24);
        const colors = result.colors ?? [];
        if (colors.length < REFERENCE_PALETTE_DARK.length) {
          throw new Error(`Insufficient colors extracted: expected at least ${REFERENCE_PALETTE_DARK.length}, got ${colors.length}`);
        }
        const theme = getBestColorScheme(colors as OkhslColor[], REFERENCE_PALETTE_DARK);
        if (!cancelled) setBase16(theme as OkhslColor[]);
      } catch (err) {
        console.warn("ImageThemePreview: failed to extract colors for", imageUrl, err);
        if (!cancelled) setError((err as Error)?.message || "Failed to generate theme");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  if (error) {
    return (
      <div className="text-sm text-gray-600 dark:text-gray-300">
        Failed to extract 16 colors for preview.
      </div>
    );
  }

  if (!base16) {
    return (
      <div className="text-sm text-gray-600 dark:text-gray-300">Generating preview…</div>
    );
  }

  return <SyntaxPreview okhslBase16={base16} language={language} idSeed={idSeed} />;
}
