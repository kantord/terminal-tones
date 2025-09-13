import { Command } from "commander";
import fs from "fs";
import path from "path";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const s = hex.replace(/^#/, "");
  const six = s.length === 3 ? s.split("").map(ch => ch + ch).join("") : s;
  const n = parseInt(six, 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function colorPreviewBlock(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  // Background colored two spaces, then reset
  return `\x1b[48;2;${r};${g};${b}m  \x1b[0m`;
}

const program = new Command();

program
  .name("terminal-tones")
  .description("A command line tool for generating terminal color schemes");

type Core = { generateColorScheme(image: string): Promise<{ terminal: string[] }> };

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
        '@terminal-tones/' + 'core'
      )) as Core);
    } catch (err) {
      // Fallback for dev without workspace linking: import source directly
      ({ generateColorScheme } = (await import(
        // Avoid TS resolving the path by computing the specifier
        '../../core/src/' + 'index.ts'
      )) as Core);
    }

    const { terminal } = await generateColorScheme(resolvedPath);
    terminal.forEach((hex, i) => {
      const block = colorPreviewBlock(hex);
      // index padded to 2 chars
      const idx = String(i).padStart(2, " ");
      process.stdout.write(`${idx}  ${hex}  ${block}\n`);
    });
  });

await program.parseAsync();
