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

function stripAnsi(input: string): string {
  return input.replace(/\x1B\[[0-9;]*m/g, "");
}

export async function renderCodePreview(terminal: string[], code?: string) {
  // dynamic imports so CLI works without optional deps
  let highlightFn: ((code: string, o: any) => string) | null = null;
  let chalkLib: any = null;
  try {
    const hlMod: any = await import("cli-highlight");
    if (hlMod && typeof hlMod.highlight === "function") {
      highlightFn = hlMod.highlight.bind(hlMod);
    } else if (typeof hlMod === "function") {
      highlightFn = hlMod;
    }
    const chalkMod: any = await import("chalk");
    chalkLib = chalkMod.default ?? chalkMod;
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
    keyword: fg(terminal[12]),
    built_in: fg(terminal[13]),
    literal: fg(terminal[11]),
    number: fg(terminal[11]),
    string: fg(terminal[10]),
    regexp: fg(terminal[14]),
    comment: fg(terminal[8]),
    meta: fg(terminal[6]),
    title: fg(terminal[7]),
    function: fg(terminal[9]),
    attr: fg(terminal[4]),
    params: fg(terminal[15]),
    "": fg(terminal[7]),
  } as const;

  const sample =
    code ??
    `// Terminal Tones sample preview\n` +
      `type User = { id: number; name: string }\n` +
      `const users: User[] = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Linus' }]\n` +
      `function find(id: number) {\n  return users.find(u => u.id === id)\n}\n` +
      `console.log('found', find(2))\n`;

  const bg = toRgb(terminal[0]);
  const columns = Math.max(0, process.stdout.columns ?? 80);
  const startBg = `\x1b[48;2;${bg.r};${bg.g};${bg.b}m`;
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
      process.stdout.write(startBg + rawLine + " ".repeat(pad) + reset + "\n");
    }
    return;
  }

  const highlighted = highlightFn!(sample, {
    language: "ts",
    theme,
    ignoreIllegals: true,
  });

  process.stdout.write("\nHighlighted preview:\n\n");
  const lines = highlighted.split(/\r?\n/);
  for (let line of lines) {
    line = line
      .replaceAll("\x1b[0m", `\x1b[0m${startBg}`)
      .replaceAll("\x1b[49m", startBg);
    const visibleLen = stripAnsi(line).length;
    const pad = Math.max(0, columns - visibleLen);
    process.stdout.write(startBg + line + " ".repeat(pad) + reset + "\n");
  }
}
