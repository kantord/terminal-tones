"use client";

import { useEffect, useState } from "react";
import type { OkhslColor } from "@terminal-tones/theme-generator";
import SyntaxPreview from "@/components/SyntaxPreview";

export default function ClientSyntaxPreview({
  okhslBase16,
  language,
  idSeed,
  fontSizePx,
  backgroundOpacity,
}: {
  okhslBase16?: OkhslColor[] | null;
  language?: string;
  idSeed?: string;
  fontSizePx?: number;
  backgroundOpacity?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (!okhslBase16 || okhslBase16.length !== 16) {
    throw new Error("ClientSyntaxPreview requires a 16-color palette");
  }

  return (
    <SyntaxPreview
      okhslBase16={okhslBase16}
      language={language}
      idSeed={idSeed}
      fontSizePx={fontSizePx}
      backgroundOpacity={backgroundOpacity}
    />
  );
}
