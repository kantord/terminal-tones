import type { Okhsl } from 'culori';
import { REFERENCE_PALETTE_DARK, REFERENCE_PALETTE_LIGHT } from './colorScheme';
import getBestColorScheme from './colorScheme';
import { deriveInitialCustomization } from './initialConfig';
import { extractColorsFromImage, convertRgbToOkhsl } from './extractColorsFromImage';

export type SourceInput = string | File | HTMLImageElement | ArrayBuffer | Buffer;

export type InitialThemeResult = {
  base16Okhsl: Okhsl[];
  defaults: {
    blackPointLightness: number;
    whitePointLightness: number;
    dynamicRange: number;
    mode: 'dark' | 'light';
  };
  meta: {
    extractedCount: number;
    colorCountRequested: number;
    sourceType: 'url' | 'path' | 'file' | 'image' | 'buffer';
  };
};

export async function generateInitialThemeFromSource(
  source: SourceInput,
  options?: { colorCount?: number; mode?: 'dark' | 'light' }
): Promise<InitialThemeResult> {
  const colorCount = options?.colorCount ?? 24;

  const { colors } = await extractOkhslCandidates(source, colorCount);

  // Auto-pick mode by median lightness unless explicit mode provided
  const pickedMode: 'dark' | 'light' = (() => {
    if (options?.mode) return options.mode;
    if (!colors || colors.length === 0) return 'dark';
    const ls = colors
      .map((c) => {
        const l = c?.l ?? 0;
        return l > 1 ? Math.max(0, Math.min(1, l / 100)) : Math.max(0, Math.min(1, l));
      })
      .sort((a, b) => a - b);
    const mid = ls.length % 2 === 1 ? ls[(ls.length - 1) / 2] : 0.5 * (ls[ls.length / 2 - 1] + ls[ls.length / 2]);
    return mid >= 0.6 ? 'light' : 'dark';
  })();

  const reference = pickedMode === 'light' ? REFERENCE_PALETTE_LIGHT : REFERENCE_PALETTE_DARK;

  if (!colors || colors.length < reference.length) {
    // Explicitly fail when insufficient colors are available to prevent silent fallbacks
    const extracted = colors?.length ?? 0;
    throw new Error(
      `Insufficient colors extracted: expected at least ${reference.length}, got ${extracted}`,
    );
  }

  const base16Okhsl = getBestColorScheme(colors, reference);
  const defaults = deriveInitialCustomization(base16Okhsl, reference);
  return {
    base16Okhsl,
    defaults: { ...defaults, mode: pickedMode },
    meta: { extractedCount: colors.length, colorCountRequested: colorCount, sourceType: detectSourceType(source) },
  };
}

export function customizeTheme(
  base16Okhsl: Okhsl[],
  overrides: { blackPointLightness?: number; whitePointLightness?: number; midpoint?: number; mode?: 'dark' | 'light' }
): Okhsl[] {
  // Placeholder: simply return base16. The existing app uses customizeColorScheme; we can
  // wire it here later to apply black/white/midpoint in OKHSL space consistently.
  return base16Okhsl;
}

async function extractOkhslCandidates(source: SourceInput, count: number): Promise<{ colors: Okhsl[] }> {
  // Browser-friendly: if File, URL string (with CORS), HTMLImageElement, or ArrayBuffer, rely on existing helper
  if (typeof window !== 'undefined') {
    if (typeof source === 'string' || source instanceof File || source instanceof HTMLImageElement) {
      const res = await extractColorsFromImage(source as any, count);
      return { colors: (res.colors ?? []) as Okhsl[] };
    }
  }

  // Node/server: accept URL or file path string, Buffer, or ArrayBuffer, using colorthief
  // Load colorthief in a way that tolerates different export shapes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import('colorthief');
  const getPalette: (src: any, n: number) => Promise<[number, number, number][]> =
    typeof mod === 'function'
      ? (mod as any).getPalette
      : mod.getPalette || (mod.default && mod.default.getPalette);
  if (typeof getPalette !== 'function') {
    return { colors: [] };
  }

  if (typeof source === 'string') {
    if (/^https?:\/\//i.test(source)) {
      const resp = await fetch(source);
      if (!resp.ok) return { colors: [] };
      const arrayBuf = await resp.arrayBuffer();
      const buf = Buffer.from(arrayBuf);
      const [{ mkdtemp, writeFile, unlink }, { tmpdir }, path] = await Promise.all([
        import('node:fs/promises'),
        import('node:os'),
        import('node:path'),
      ]);
      const dir = await mkdtemp(path.join(tmpdir(), 'tt-lib-'));
      const filePath = path.join(dir, `${Math.random().toString(36).slice(2)}.jpg`);
      await writeFile(filePath, buf);
      try {
        const palette = await getPalette(filePath, count);
        return { colors: palette.map(convertRgbToOkhsl) as Okhsl[] };
      } finally {
        try { await unlink(filePath); } catch {}
      }
    } else {
      const palette = await getPalette(source, count);
      return { colors: palette.map(convertRgbToOkhsl) as Okhsl[] };
    }
  }

  if (typeof Buffer !== 'undefined' && (source as any) instanceof Buffer) {
    const palette = await getPalette(source as any, count);
    return { colors: palette.map(convertRgbToOkhsl) as Okhsl[] };
  }

  if (source instanceof ArrayBuffer) {
    const buf = Buffer.from(source);
    const palette = await getPalette(buf as any, count);
    return { colors: palette.map(convertRgbToOkhsl) as Okhsl[] };
  }

  return { colors: [] };
}

function detectSourceType(source: SourceInput): InitialThemeResult['meta']['sourceType'] {
  if (typeof source === 'string') return /^https?:\/\//i.test(source) ? 'url' : 'path';
  if (typeof window !== 'undefined') {
    if (typeof File !== 'undefined' && source instanceof File) return 'file';
    if (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement) return 'image';
  }
  if (source instanceof ArrayBuffer) return 'buffer';
  return 'path';
}
