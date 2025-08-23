"use client";

import { useEffect, useState } from "react";
import type { OkhslColor } from "@terminal-tones/theme-generator";
import SyntaxPreview from "@/components/SyntaxPreview";

// NOTE: no longer used on the home page; kept for the create-color-scheme tool UI if needed
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
        const resp = await fetch("/api/generate-theme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: imageUrl, colorCount: 24 }),
        });
        if (!resp.ok) throw new Error("server extraction failed");
        const data = await resp.json();
        if (!cancelled) {
          const base16 = Array.isArray(data?.base16Okhsl) ? (data.base16Okhsl as OkhslColor[]) : null;
          setBase16(base16);
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
