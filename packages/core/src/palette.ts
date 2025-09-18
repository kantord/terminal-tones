import { getPalette } from "colorthief";
import type { InputImage } from "./types";
import { rgbToHex, toOkhsl, okhslToHex } from "./utils";

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function extendWithHarmonies(hexes: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < hexes.length; i++) {
    const base = String(hexes[i]);
    const o = toOkhsl(base);
    const h = (o.h ?? 0) % 360;
    const s = clamp01(o.s ?? 0);
    const l = clamp01(o.l ?? 0);

    const comp = {
      mode: "okhsl" as const,
      h: (h + 180 + 360) % 360,
      s: clamp01(s * 0.9),
      l,
    };
    out.push(okhslToHex(comp));

    const delta = i % 2 === 0 ? 30 : -30;
    const anal = {
      mode: "okhsl" as const,
      h: (h + delta + 360) % 360,
      s: clamp01(s * 0.95),
      l,
    };
    out.push(okhslToHex(anal));
  }
  return out;
}

export async function stealPalette(image: InputImage): Promise<string[]> {
  // Extract 16 colors first, then 6 more, and keep all results
  // (allowing some slight duplication across runs).
  const first = await getPalette(image, 16, 100);
  const second = await getPalette(image, 6, 100);
  const third = await getPalette(image, 4, 100);
  const palette = [...first, ...second, ...third];
  const baseHex = palette.map(([r, g, b]: [number, number, number]) =>
    rgbToHex(r, g, b),
  );
  const harmonyHex = extendWithHarmonies(
    third.map(([r, g, b]: [number, number, number]) => rgbToHex(r, g, b)),
  );
  // Include extended harmony colors twice as requested
  return [...baseHex, ...harmonyHex, ...harmonyHex];
}
