import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Local copy of minimal color algorithm to avoid depending on workspace build
import { convertOklabToOkhsl, convertRgbToOklab, formatHex, convertOkhslToOklab, convertOklabToRgb } from 'culori';

type Okhsl = { mode: 'okhsl'; h?: number; s: number; l: number };

const REFERENCE_PALETTE_DARK: [Okhsl, string][] = [
  [{ mode: 'okhsl', h: 0, s: 0, l: 0.11 }, 'base00'],
  [{ mode: 'okhsl', h: 0, s: 0, l: 0.16 }, 'base01'],
  [{ mode: 'okhsl', h: 0, s: 0, l: 0.21 }, 'base02'],
  [{ mode: 'okhsl', h: 0, s: 0, l: 0.38 }, 'base03'],
  [{ mode: 'okhsl', h: 0, s: 0, l: 0.69 }, 'base04'],
  [{ mode: 'okhsl', h: 0, s: 0, l: 0.83 }, 'base05'],
  [{ mode: 'okhsl', h: 0, s: 0, l: 0.89 }, 'base06'],
  [{ mode: 'okhsl', h: 0, s: 0, l: 0.95 }, 'base07'],
  [{ mode: 'okhsl', h: 12, s: 0.75, l: 0.55 }, 'base08'],
  [{ mode: 'okhsl', h: 32, s: 0.75, l: 0.55 }, 'base09'],
  [{ mode: 'okhsl', h: 52, s: 0.75, l: 0.55 }, 'base0A'],
  [{ mode: 'okhsl', h: 132, s: 0.75, l: 0.60 }, 'base0B'],
  [{ mode: 'okhsl', h: 182, s: 0.75, l: 0.60 }, 'base0C'],
  [{ mode: 'okhsl', h: 222, s: 0.75, l: 0.65 }, 'base0D'],
  [{ mode: 'okhsl', h: 282, s: 0.75, l: 0.65 }, 'base0E'],
  [{ mode: 'okhsl', h: 12, s: 0.75, l: 0.55 }, 'base0F'],
];

function convertRgbToOkhsl([r, g, b]: [number, number, number]): Okhsl {
  const oklab = convertRgbToOklab({ r, g, b, alpha: 1.0 });
  return convertOklabToOkhsl(oklab) as Okhsl;
}

function okhslToHex(color: Okhsl): string {
  const l = color.l > 1 ? color.l / 100 : color.l;
  const normalized = { mode: 'okhsl', h: color.h ?? 0, s: Math.max(0, Math.min(1, color.s)), l: Math.max(0, Math.min(1, l)) } as Okhsl;
  const oklab = convertOkhslToOklab(normalized as any);
  const rgb = convertOklabToRgb(oklab);
  return formatHex(rgb);
}

function getBestColorScheme(candidates: Okhsl[], reference: Okhsl[]): Okhsl[] {
  // Simple heuristic: take first 16 for now (placeholder). In future, use munkres/Hungarian.
  return candidates.slice(0, 16);
}
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
      const hexColors = await generateFromSource(source, count);
      hexColors.forEach((hex) => console.log(hex));
    } catch (err) {
      console.error('Error:', (err as Error)?.message || err);
      process.exit(1);
    }
  },
};

export async function generateFromSource(source: string, count: number = 24): Promise<string[]> {
  const palette = await extractPalette(source, count);
  if (!palette || palette.length === 0) {
    throw new Error('Failed to extract colors');
  }
  const okhslCandidates = palette.map(convertRgbToOkhsl);
  const selected = getBestColorScheme(okhslCandidates, REFERENCE_PALETTE_DARK.map(([c]) => c));
  // Ensure we return 16 colors by cycling if needed
  const base16: Okhsl[] = [];
  for (let i = 0; i < 16; i++) {
    base16.push(selected[i % selected.length]);
  }
  return base16.map(okhslToHex);
}

async function extractPalette(source: string, count: number): Promise<[number, number, number][]> {
  // colorthief has no TS types for Node API
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
