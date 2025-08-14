"use client";

import { useEffect, useState } from "react";
import type { OkhslColor } from "@terminal-tones/theme-generator";
import SyntaxPreview from "@/components/SyntaxPreview";

export default function ClientSyntaxPreview({
  okhslBase16,
  language,
  idSeed,
}: {
  okhslBase16?: OkhslColor[] | null;
  language?: string;
  idSeed?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <SyntaxPreview
      okhslBase16={okhslBase16 ?? null}
      language={language}
      idSeed={idSeed}
    />
  );
}
