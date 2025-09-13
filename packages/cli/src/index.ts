import { Command } from "commander";
import fs from "fs";
import path from "path";

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

function colorPreviewBlock(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  // Background colored two spaces, then reset
  return `\x1b[48;2;${r};${g};${b}m  \x1b[0m`;
}

// Minimal ANSI stripper for width calculations
function stripAnsi(input: string): string {
  return input.replace(/\x1B\[[0-9;]*m/g, "");
}

const program = new Command();

program
  .name("terminal-tones")
  .description("A command line tool for generating terminal color schemes");

type ContrastColorValue = { name: string; contrast: number; value: string };
type ContrastColorGroup =
  | { background: string }
  | { name: string; values: ContrastColorValue[] };
type Core = {
  generateColorScheme(
    image: string,
  ): Promise<{ terminal: string[]; contrastColors: ContrastColorGroup[] }>;
};

program
  .command("from-image")
  .description("Generate a color scheme from an image")
  .argument("<path>", "path to image file")
  .action(async (imagePath: string) => {
    // Resolve the image path relative to the shell's original CWD (pnpm sets INIT_CWD)
    const baseCwd = process.env.INIT_CWD || process.cwd();
    const resolvedPath = path.isAbsolute(imagePath)
      ? imagePath
      : path.resolve(baseCwd, imagePath);

    if (!fs.existsSync(resolvedPath)) {
      console.error(`File not found: ${resolvedPath}`);
      process.exitCode = 1;
      return;
    }
    let generateColorScheme: Core["generateColorScheme"];
    try {
      ({ generateColorScheme } = (await import(
        // computed specifier prevents TS from trying to resolve types here
        "@terminal-tones/" + "core"
      )) as Core);
    } catch {
      // Fallback for dev without workspace linking: import source directly
      ({ generateColorScheme } = (await import(
        // Avoid TS resolving the path by computing the specifier
        "../../core/src/" + "index.ts"
      )) as Core);
    }

    const { terminal, contrastColors } =
      await generateColorScheme(resolvedPath);

    // Print terminal 16 colors
    process.stdout.write("Terminal 16 colors:\n");
    terminal.forEach((hex, i) => {
      const block = colorPreviewBlock(hex);
      const idx = String(i).padStart(2, " ");
      process.stdout.write(`${idx}  ${hex}  ${block}\n`);
    });

    // Print full contrast color swatches
    process.stdout.write("\nContrast color swatches:\n");
    for (const group of contrastColors) {
      if ("background" in group) {
        const hex = String(group.background);
        const block = colorPreviewBlock(hex);
        process.stdout.write(`bg  ${hex}  ${block}\n`);
      } else {
        process.stdout.write(`\n${group.name}:\n`);
        for (const v of group.values) {
          const hex = String(v.value);
          const block = colorPreviewBlock(hex);
          process.stdout.write(
            `  ${v.name.padEnd(16)} ${String(v.contrast).padStart(4)}  ${hex}  ${block}\n`,
          );
        }
      }
    }

    // Additionally show a syntax-highlighted preview using the generated palette
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
      // deps not available; will show plain preview
    }

    const toRgb = (hex: string) => {
      const { r, g, b } = hexToRgb(hex);
      return { r, g, b };
    };
    const bg = toRgb(terminal[0]);
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

    const code = `// Terminal Tones sample preview\n` +
      `type User = { id: number; name: string }\n` +
      `const users: User[] = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Linus' }]\n` +
      `function find(id: number) {\n  return users.find(u => u.id === id)\n}\n` +
      `console.log('found', find(2))\n`;

    const missingDeps = !highlightFn || !chalkLib;
    if (missingDeps) {
      process.stdout.write(
        "\nNote: For syntax-highlighted preview, install optional deps: cli-highlight and chalk.\n" +
          "pnpm -F @terminal-tones/cli add cli-highlight chalk\n",
      );
    }
    process.stdout.write("\n" + (missingDeps ? "Plain preview:" : "Highlighted preview:") + "\n\n");
    const columns = Math.max(0, process.stdout.columns ?? 80);
    if (missingDeps) {
      // Print code filling the full terminal width with the theme background
      const { r, g, b } = bg;
      const startBg = `\x1b[48;2;${r};${g};${b}m`;
      const reset = "\x1b[0m";
      for (const rawLine of code.split(/\r?\n/)) {
        const visible = rawLine;
        const pad = Math.max(0, columns - visible.length);
        process.stdout.write(startBg + rawLine + " ".repeat(pad) + reset + "\n");
      }
    } else {
      // Highlight then enforce a full-width background per line
      const highlighted = highlightFn!(code, {
        language: "ts",
        theme,
        ignoreIllegals: true,
      });
      const { r, g, b } = bg;
      const startBg = `\x1b[48;2;${r};${g};${b}m`;
      const reset = "\x1b[0m";
      const lines = highlighted.split(/\r?\n/);
      for (let line of lines) {
        // Keep background applied after any reset sequences within tokens
        line = line.replaceAll("\x1b[0m", `\x1b[0m${startBg}`)
                   .replaceAll("\x1b[49m", startBg);
        const visibleLen = stripAnsi(line).length;
        const pad = Math.max(0, columns - visibleLen);
        process.stdout.write(startBg + line + " ".repeat(pad) + reset + "\n");
      }
    }
  });

await program.parseAsync();
