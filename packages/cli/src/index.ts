import { Command } from "commander";
import fs from "fs";
import path from "path";
import { renderCodePreview } from "./preview";
import type { ColorScheme, GenerateOptions } from "@terminal-tones/core";

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
// (preview ANSI handling moved to ./preview)

const program = new Command();

program
  .name("terminal-tones")
  .description("A command line tool for generating terminal color schemes");

type Core = {
  generateColorScheme(
    image: string,
    options: GenerateOptions,
  ): Promise<ColorScheme>;
};

program
  .command("from-image")
  .description("Generate a color scheme from an image")
  .argument("<path>", "path to image file")
  .option(
    "--background-lightness-multiplier <number>",
    "multiply target background lightness (e.g. 1.5)",
    (v) => Number(v),
    1,
  )
  // Legacy alias (deprecated): --lightness-multiplier
  .option(
    "--lightness-multiplier <number>",
    "[deprecated] alias of --background-lightness-multiplier",
    (v) => Number(v),
  )
  .option(
    "--contrast-multiplier <number>",
    "multiply contrast ratios 1..9 (e.g. 1.5)",
    (v) => Number(v),
    1,
  )
  .option(
    "--contrast-lift <number>",
    "add to contrast ratios 1..9 (e.g. 1.5)",
    (v) => Number(v),
    0,
  )
  .option(
    "--contrast-scale <scale>",
    "contrast ratio spacing: linear|geometric",
    (v: string) => {
      const val = String(v).toLowerCase();
      if (val !== "linear" && val !== "geometric") {
        throw new Error(
          `Invalid value for --contrast-scale: ${v}. Expected 'linear' or 'geometric'.`,
        );
      }
      return val as "linear" | "geometric";
    },
    "linear",
  )
  .option("--contrast-min <number>", "min contrast (geometric scale)", (v) =>
    Number(v),
  )
  .option("--contrast-max <number>", "max contrast (geometric scale)", (v) =>
    Number(v),
  )
  .option(
    "--contrast-gamma <number>",
    "easing exponent (geometric scale)",
    (v) => Number(v),
  )
  .option(
    "--foreground-lightness-multiplier <number>",
    "multiply default foreground lightness (e.g. 1.2)",
    (v) => Number(v),
    1,
  )
  .option(
    "--saturation-multiplier <number>",
    "multiply OKHSL saturation for outputs (e.g. 0.9)",
    (v) => Number(v),
    1,
  )
  .option(
    "--mode <mode>",
    "color scheme mode: light|dark",
    (v: string) => (v === "light" || v === "dark" ? v : "dark"),
    "dark",
  )
  .option(
    "--template <name>",
    "render a terminal theme template (e.g. 'kitty')",
  )
  .action(
    async (
      imagePath: string,
      opts: {
        backgroundLightnessMultiplier: number;
        lightnessMultiplier?: number; // legacy
        contrastMultiplier: number;
        contrastLift: number;
        saturationMultiplier: number;
        contrastScale: "linear" | "geometric";
        contrastMin?: number;
        contrastMax?: number;
        contrastGamma?: number;
        foregroundLightnessMultiplier: number;
        mode: "light" | "dark";
        template?: string;
      },
    ) => {
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

      const genOpts: GenerateOptions & {
        contrastScale?: "linear" | "geometric";
        contrastMin?: number;
        contrastMax?: number;
        contrastGamma?: number;
        saturationMultiplier?: number;
      } = {
        mode: opts.mode,
        backgroundLightnessMultiplier:
          opts.backgroundLightnessMultiplier ?? opts.lightnessMultiplier ?? 1,
        foregroundLightnessMultiplier: opts.foregroundLightnessMultiplier,
        saturationMultiplier: opts.saturationMultiplier,
        contrastMultiplier: opts.contrastMultiplier,
        contrastLift: opts.contrastLift,
        contrastScale: opts.contrastScale,
        contrastMin: opts.contrastMin,
        contrastMax: opts.contrastMax,
        contrastGamma: opts.contrastGamma,
      };
      const { terminal, contrastColors, semanticColors } =
        await generateColorScheme(resolvedPath, genOpts);

      // If a template is requested, render it and exit early
      if (opts.template) {
        const name = String(opts.template).toLowerCase();
        if (name === "kitty") {
          type TK = {
            renderKittyTheme: (s: ColorScheme, o?: { name?: string }) => string;
          };
          let renderKittyTheme: TK["renderKittyTheme"]; // lazy import with fallback
          try {
            ({ renderKittyTheme } = (await import(
              "@terminal-tones/" + "template-kitty"
            )) as TK);
          } catch {
            ({ renderKittyTheme } = (await import(
              "../../template-kitty/src/" + "index.ts"
            )) as TK);
          }
          const output = renderKittyTheme(
            { terminal, contrastColors, semanticColors },
            { name: "terminal-tones" },
          );
          process.stdout.write(output);
          return;
        }
        console.error(`Unknown template: ${opts.template}`);
        process.exitCode = 2;
        return;
      }

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

      // Print semantic colors summary (terminal fg/bg, semantic name, actual group name)
      const lines: Array<{ key: keyof typeof semanticColors; label: string }> =
        [
          { key: "background", label: "background" },
          { key: "neutral", label: "neutral" },
          { key: "error", label: "error" },
          { key: "success", label: "success" },
          { key: "warning", label: "warning" },
          { key: "primary", label: "primary" },
          { key: "secondary", label: "secondary" },
          { key: "tertiary", label: "tertiary" },
          { key: "quaternary", label: "quaternary" },
        ];
      process.stdout.write("\nSemantic colors:\n");
      const rows = lines.map(({ key, label }) => {
        const entry = (
          semanticColors as Record<
            string,
            {
              terminalColor: { fg: string; bg: string };
              color?: { name?: string };
            }
          >
        )[key as string];
        const groupName = entry?.color?.name ?? String(key);
        const fg = entry.terminalColor.fg;
        const bg = entry.terminalColor.bg;
        return { label, groupName, fg, bg };
      });
      const labelW = Math.max(...rows.map((r) => r.label.length));
      const groupW = Math.max(...rows.map((r) => r.groupName.length));
      for (const r of rows) {
        const fgBlock = colorPreviewBlock(r.fg);
        const bgBlock = colorPreviewBlock(r.bg);
        process.stdout.write(
          `${r.label.padEnd(labelW)}  ${r.groupName.padEnd(groupW)}  fg:${r.fg}  ${fgBlock}  bg:${r.bg}  ${bgBlock}\n`,
        );
      }

      await renderCodePreview(semanticColors);

      // Diff-style preview using semantic background highlights
      const diffSample =
        `function sum(a: number, b: number) {\n` +
        `  const result = a + b\n` +
        `  return result\n` +
        `}\n` +
        `\n` +
        `console.log(sum(2, 3))\n`;
      await renderCodePreview(semanticColors, {
        heading: "Diff preview:",
        code: diffSample,
        added: [2],
        removed: [3],
      });
    },
  );

// Commander + pnpm: pnpm inserts a standalone "--" before script args.
// Strip it so options after it are still parsed by Commander.
const argv = process.argv.slice();
const sepIndex = argv.indexOf("--");
if (sepIndex !== -1) argv.splice(sepIndex, 1);
await program.parseAsync(argv);
