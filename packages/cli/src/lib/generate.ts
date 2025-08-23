import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { okhslToHex } from '@terminal-tones/theme-generator';
import { generateInitialThemeFromSource } from '@terminal-tones/theme-generator/preconfigured';

// colorthief has no TS types for Node API; import dynamically where used

type GenerateArgs = {
  _: (string | number)[];
  $0: string;
  url?: string;
};

export const generateCommand = {
  command: 'generate <source>',
  describe: 'Generate a 16-color base16 palette from an image URL or local file',
  builder: (yargs: any) =>
    yargs
      .positional('source', {
        type: 'string',
        describe: 'Image URL (http/https) or local file path',
      })
      .option('count', {
        alias: 'n',
        type: 'number',
        default: 24,
        describe: 'Number of colors to extract before selecting best 16',
      })
      .example('$0 generate https://example.com/image.jpg', 'Generate from remote image')
      .example('$0 generate ./photo.jpg', 'Generate from local file'),
  handler: async (argv: any) => {
    const source: string = argv.source;
    const count: number = argv.count ?? 24;

    try {
      const { base16Okhsl } = await generateInitialThemeFromSource(source, { colorCount: count, mode: 'dark' });
      const hexColors = base16Okhsl.map(okhslToHex);
      hexColors.forEach((hex) => console.log(hex));
    } catch (err) {
      console.error('Error:', (err as Error)?.message || err);
      process.exit(1);
    }
  },
};

export async function generateFromSource(source: string, count: number = 24): Promise<string[]> {
  const { base16Okhsl } = await generateInitialThemeFromSource(source, { colorCount: count, mode: 'dark' });
  return base16Okhsl.map(okhslToHex);
}

async function extractPalette(source: string, count: number): Promise<[number, number, number][]> {
  // Keep this function temporarily for tests that mock colorthief. Not used by CLI path anymore.
  const { getPalette } = await import('colorthief' as any) as unknown as { getPalette: (src: string, count: number) => Promise<[number, number, number][]> };

  if (/^https?:\/\//i.test(source)) {
    // Remote URL: download to temp file for robust reading
    const resp = await fetch(source);
    if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.status}`);
    const arrayBuf = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    const [{ mkdtemp, writeFile, unlink }, { tmpdir }, nodePath] = await Promise.all([
      import('node:fs/promises'),
      import('node:os'),
      import('node:path'),
    ]);
    const dir = await mkdtemp(nodePath.join(tmpdir(), 'tt-cli-'));
    const filePath = nodePath.join(dir, `${Math.random().toString(36).slice(2)}.jpg`);
    await writeFile(filePath, buffer);
    try {
      return (await getPalette(filePath, count)) as [number, number, number][];
    } finally {
      try { await unlink(filePath); } catch {}
    }
  } else {
    // Local file path
    const abs = path.resolve(process.cwd(), source);
    try {
      await fs.access(abs);
    } catch {
      throw new Error(`File not found: ${abs}`);
    }
    return (await getPalette(abs, count)) as [number, number, number][];
  }
}
