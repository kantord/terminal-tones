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
  extractAccents(
    image: string,
    options: GenerateOptions,
  ): Promise<{
    primary: { name: string; hex: string };
    secondary: { name: string; hex: string };
  }>;
};

program
  .command("from-image")
  .description("Generate a color scheme from an image")
  .argument("<path>", "path to image file")
  .option(
    "--lightness-multiplier <number>",
    "multiply target background lightness (e.g. 1.5)",
    (v) => Number(v),
    1,
  )
  .option(
    "--contrast-multiplier <number>",
    "multiply contrast ratios 1..9 (e.g. 1.5)",
    (v) => Number(v),
    1,
  )
  .option(
    "--mode <mode>",
    "color scheme mode: light|dark",
    (v: string) => (v === "light" || v === "dark" ? v : "dark"),
    "dark",
  )
  .action(
    async (
      imagePath: string,
      opts: {
        lightnessMultiplier: number;
        contrastMultiplier: number;
        mode: "light" | "dark";
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
      let extractAccents: Core["extractAccents"];
      try {
        ({ generateColorScheme, extractAccents } = (await import(
          // computed specifier prevents TS from trying to resolve types here
          "@terminal-tones/" + "core"
        )) as Core);
      } catch {
        // Fallback for dev without workspace linking: import source directly
        ({ generateColorScheme, extractAccents } = (await import(
          // Avoid TS resolving the path by computing the specifier
          "../../core/src/" + "index.ts"
        )) as Core);
      }

      const { terminal, contrastColors } = await generateColorScheme(
        resolvedPath,
        {
          mode: opts.mode,
          lightnessMultiplier: opts.lightnessMultiplier,
          contrastMultiplier: opts.contrastMultiplier,
        },
      );

      const accents = await extractAccents(resolvedPath, {
        mode: opts.mode,
        lightnessMultiplier: opts.lightnessMultiplier,
        contrastMultiplier: opts.contrastMultiplier,
      });

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

      // Print primary/secondary accents
      process.stdout.write("\nAccents:\n");
      const pBlock = colorPreviewBlock(accents.primary.hex);
      const sBlock = colorPreviewBlock(accents.secondary.hex);
      process.stdout.write(
        `Primary   (${accents.primary.name}): ${accents.primary.hex}  ${pBlock}\n`,
      );
      process.stdout.write(
        `Secondary (${accents.secondary.name}): ${accents.secondary.hex}  ${sBlock}\n`,
      );

      await renderCodePreview(terminal);
    },
  );

// Commander + pnpm: pnpm inserts a standalone "--" before script args.
// Strip it so options after it are still parsed by Commander.
const argv = process.argv.slice();
const sepIndex = argv.indexOf("--");
if (sepIndex !== -1) argv.splice(sepIndex, 1);
await program.parseAsync(argv);
