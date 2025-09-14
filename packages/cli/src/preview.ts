// Render a syntax-highlighted code preview using the provided terminal palette
// Falls back to plain text but still paints the full-width background

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const s = hex.replace(/^#/, "");
  const six =
    s.length === 3
      ? s
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : s;
  const n = parseInt(six, 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

// Strip ANSI SGR sequences (ESC [ ... m). Build pattern dynamically to satisfy lint.
const ESC = String.fromCharCode(27);
const ANSI_SGR_RE = new RegExp(`${ESC}\\[[0-9;]*m`, "g");
function stripAnsi(input: string): string {
  return input.replace(ANSI_SGR_RE, "");
}

// Minimal shape for semantic colors from core
type ContrastValue = { value: string; contrast: number; name?: string };
type ContrastGroupLike = { name?: string; values?: ContrastValue[] };
type SemValueFull = { terminalColor: string; color?: ContrastGroupLike };
type BackgroundSem = { terminalColor: string; color: { background: string } };
type SemanticColorsLike = {
  background: BackgroundSem;
  neutral: SemValueFull;
  error: SemValueFull;
  success: SemValueFull;
  warning: SemValueFull;
  primary: SemValueFull;
  secondary: SemValueFull;
  tertiary?: SemValueFull;
  quaternary?: SemValueFull;
};

export async function renderCodePreview(
  semantic: SemanticColorsLike,
  opts?: {
    code?: string;
    added?: number[];
    removed?: number[];
    heading?: string;
  },
) {
  // dynamic imports so CLI works without optional deps
  type ColorFn = (s: string) => string;
  type Highlighter = (
    code: string,
    o: {
      language?: string;
      theme?: Record<string, ColorFn>;
      ignoreIllegals?: boolean;
    },
  ) => string;
  type HighlightModule = { highlight: Highlighter };
  type ChalkLike = { rgb: (r: number, g: number, b: number) => ColorFn };

  let highlightFn: Highlighter | null = null;
  let chalkLib: ChalkLike | null = null;
  try {
    const hlMod: unknown = await import("cli-highlight");
    if (
      hlMod &&
      typeof hlMod === "object" &&
      "highlight" in hlMod &&
      typeof (hlMod as { highlight: unknown }).highlight === "function"
    ) {
      const m = hlMod as HighlightModule;
      highlightFn = m.highlight.bind(m);
    } else if (typeof hlMod === "function") {
      highlightFn = hlMod as Highlighter;
    }

    const chalkMod: unknown = await import("chalk");
    // Prefer default export if present
    const maybeChalk =
      chalkMod && typeof chalkMod === "object" && "default" in chalkMod
        ? (chalkMod as { default: unknown }).default
        : chalkMod;
    if (
      (typeof maybeChalk === "function" || typeof maybeChalk === "object") &&
      maybeChalk !== null &&
      "rgb" in (maybeChalk as Record<string, unknown>) &&
      typeof (maybeChalk as { rgb: unknown }).rgb === "function"
    ) {
      chalkLib = maybeChalk as ChalkLike;
    }
  } catch {
    // optional deps missing
  }

  const toRgb = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    return { r, g, b };
  };
  const fg = (hex: string) => {
    if (!chalkLib) return (s: string) => s;
    const { r, g, b } = toRgb(hex);
    return chalkLib.rgb(r, g, b);
  };

  const theme = {
    keyword: fg(semantic.primary.terminalColor),
    built_in: fg(semantic.secondary.terminalColor),
    literal: fg((semantic.tertiary ?? semantic.secondary).terminalColor),
    number: fg((semantic.tertiary ?? semantic.secondary).terminalColor),
    string: fg((semantic.quaternary ?? semantic.secondary).terminalColor),
    regexp: fg((semantic.quaternary ?? semantic.secondary).terminalColor),
    comment: fg(semantic.neutral.terminalColor),
    meta: fg(semantic.neutral.terminalColor),
    title: fg(semantic.primary.terminalColor),
    function: fg(semantic.primary.terminalColor),
    attr: fg(semantic.secondary.terminalColor),
    params: fg(semantic.neutral.terminalColor),
    "": fg(semantic.neutral.terminalColor),
  } as const;

  const sample =
    opts?.code ??
    `// Terminal Tones sample preview\n` +
      `type User = { id: number; name: string }\n` +
      `const users: User[] = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Linus' }]\n` +
      `function find(id: number) {\n  return users.find(u => u.id === id)\n}\n` +
      `console.log('found', find(2))\n`;

  const bg = toRgb(semantic.background.color.background);
  const df = toRgb(semantic.neutral.terminalColor);
  const columns = Math.max(0, process.stdout.columns ?? 80);
  const startBg = `\x1b[48;2;${bg.r};${bg.g};${bg.b}m`;
  const startFg = `\x1b[38;2;${df.r};${df.g};${df.b}m`;
  const reset = "\x1b[0m";

  const missingDeps = !highlightFn || !chalkLib;
  if (missingDeps) {
    process.stdout.write(
      "\nNote: For syntax-highlighted preview, install optional deps: cli-highlight and chalk.\n" +
        "pnpm -F @terminal-tones/cli add cli-highlight chalk\n",
    );
    process.stdout.write("\nPlain preview:\n\n");
    for (const rawLine of sample.split(/\r?\n/)) {
      const visible = rawLine;
      const pad = Math.max(0, columns - visible.length);
      process.stdout.write(
        startBg + startFg + rawLine + " ".repeat(pad) + reset + "\n",
      );
    }
    return;
  }

  const highlighted = highlightFn!(sample, {
    language: "ts",
    theme,
    ignoreIllegals: true,
  });

  const addBgHex =
    semantic.success.color?.values?.[1]?.value ||
    semantic.success.terminalColor;
  const delBgHex =
    semantic.error.color?.values?.[1]?.value || semantic.error.terminalColor;
  const addBg = toRgb(String(addBgHex));
  const delBg = toRgb(String(delBgHex));
  const addBgEsc = `\x1b[48;2;${addBg.r};${addBg.g};${addBg.b}m`;
  const delBgEsc = `\x1b[48;2;${delBg.r};${delBg.g};${delBg.b}m`;
  const addedSet = new Set(
    (opts?.added ?? []).map((n) => Math.max(1, Math.floor(n))),
  );
  const removedSet = new Set(
    (opts?.removed ?? []).map((n) => Math.max(1, Math.floor(n))),
  );

  const heading = opts?.heading ?? "Highlighted preview:";
  process.stdout.write(`\n${heading}\n\n`);
  const lines = highlighted.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const lineNo = i + 1;
    const lineBg = addedSet.has(lineNo)
      ? addBgEsc
      : removedSet.has(lineNo)
        ? delBgEsc
        : startBg;
    // After any reset, re-apply background and default foreground so
    // unstyled text uses our palette (affected by contrast settings).
    line = line
      .replaceAll("\x1b[0m", `\x1b[0m${lineBg}${startFg}`)
      .replaceAll("\x1b[49m", lineBg)
      .replaceAll("\x1b[39m", startFg);
    const visibleLen = stripAnsi(line).length;
    const pad = Math.max(0, columns - visibleLen);
    process.stdout.write(
      lineBg + startFg + line + " ".repeat(pad) + reset + "\n",
    );
  }
}
