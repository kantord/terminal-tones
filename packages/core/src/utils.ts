import { converter } from "culori";
import type { OKHSL } from "./types";

export const toOkhsl = converter("okhsl") as (
  c: string | { mode?: string },
) => OKHSL;

const toRgb = converter("rgb") as (c: string | { mode?: string }) => {
  mode: "rgb";
  r?: number;
  g?: number;
  b?: number;
  alpha?: number;
};

export function okhslToHex(c: OKHSL): string {
  const rgb = toRgb(c);
  const r = Math.max(0, Math.min(255, Math.round((rgb.r ?? 0) * 255)));
  const g = Math.max(0, Math.min(255, Math.round((rgb.g ?? 0) * 255)));
  const b = Math.max(0, Math.min(255, Math.round((rgb.b ?? 0) * 255)));
  return rgbToHex(r, g, b);
}

export function isHexColor(s: string): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(s.trim());
}

export function hueDeltaDeg(h1?: number, h2?: number): number {
  const a = (((h1 ?? 0) % 360) + 360) % 360;
  const b = (((h2 ?? 0) % 360) + 360) % 360;
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function okhslDiff(aHex: string, bHex: string) {
  const a = toOkhsl(aHex);
  const b = toOkhsl(bHex);
  return {
    dL: Math.abs((a.l ?? 0) - (b.l ?? 0)),
    dS: Math.abs((a.s ?? 0) - (b.s ?? 0)),
    dH: hueDeltaDeg(a.h, b.h),
  };
}

export const rgbToHex = (r: number, g: number, b: number) =>
  "#" +
  [r, g, b]
    .map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    })
    .join("");

export function normalizeHex(hex: string): string {
  const s = hex.trim().replace(/^#/, "");
  const six =
    s.length === 3
      ? s
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : s;
  return ("#" + six.toLowerCase()).slice(0, 7);
}
