import path from "path";
import { describe, it, expect } from "vitest";
import { generateColorScheme } from "..";
import { converter } from "culori";

const toOkhsl = converter("okhsl") as (c: string) => { l?: number };

function getLightnessValue(hex: string): number {
  return toOkhsl(hex).l ?? 0;
}

function byName(name: string, contrastColors: any) {
  return contrastColors.find((g: any) => g && g.name === name);
}

const EPS = 1e-9;

describe("Lightness and contrast ordering", () => {
  describe.each(["dark", "light"]) ("mode %s", (mode) => {
  describe.each([1, 2])("image %s", (n) => {
    const img = path.join(__dirname, "images", `image${n}.jpg`);

    it.each(["red", "blue"]) (
      "lightness multiplier keeps expected swatch order (%s)",
      async (colorName: string) => {
        const reduced = await generateColorScheme(img, { mode, lightnessMultiplier: 0.5 });
        const normal = await generateColorScheme(img, { mode, lightnessMultiplier: 1 });
        const increased = await generateColorScheme(img, { mode, lightnessMultiplier: 1.5 });

        // Use a stable swatch index across the 9 steps for comparison
        const idx = 5; // sixth value in the ramp

        const r = byName(colorName, reduced.contrastColors)!;
        const n = byName(colorName, normal.contrastColors)!;
        const i = byName(colorName, increased.contrastColors)!;

        const samples = [r.values[idx].value, n.values[idx].value, i.values[idx].value];
        const expectedOrder = [samples[0], samples[1], samples[2]]; // darker -> normal -> lighter
        const sorted = [...samples].sort((a, b) => {
          const dl = getLightnessValue(a) - getLightnessValue(b);
          if (Math.abs(dl) <= EPS) throw new Error("Tie in lightness values");
          return dl;
        });
        expect(sorted).toEqual(expectedOrder);
      }
    );

    it("lightness multiplier keeps expected terminal order (bright red)", async () => {
      const reduced = await generateColorScheme(img, { mode, lightnessMultiplier: 0.5 });
      const normal = await generateColorScheme(img, { mode, lightnessMultiplier: 1 });
      const increased = await generateColorScheme(img, { mode, lightnessMultiplier: 1.5 });

      const samples = [reduced.terminal[9], normal.terminal[9], increased.terminal[9]];
      const expectedOrder = [samples[0], samples[1], samples[2]];
      const sorted = [...samples].sort((a, b) => {
        const dl = getLightnessValue(a) - getLightnessValue(b);
        if (Math.abs(dl) <= EPS) throw new Error("Tie in lightness values");
        return dl;
      });
      expect(sorted).toEqual(expectedOrder);
    });

    it.each(["red", "blue"]) (
      "contrast multiplier keeps expected swatch order by lightness delta vs background (%s)",
      async (colorName: string) => {
        const low = await generateColorScheme(img, { mode, contrastMultiplier: 0.5 });
        const mid = await generateColorScheme(img, { mode, contrastMultiplier: 1 });
        const high = await generateColorScheme(img, { mode, contrastMultiplier: 1.5 });

        const idx = 5; // sixth value in ramp

        const gLow = byName(colorName, low.contrastColors)!;
        const gMid = byName(colorName, mid.contrastColors)!;
        const gHigh = byName(colorName, high.contrastColors)!;

        const samples = [
          { hex: gLow.values[idx]?.value ?? gLow.values[gLow.values.length - 1].value, lbg: getLightnessValue(low.terminal[0]) },
          { hex: gMid.values[idx]?.value ?? gMid.values[gMid.values.length - 1].value, lbg: getLightnessValue(mid.terminal[0]) },
          { hex: gHigh.values[idx]?.value ?? gHigh.values[gHigh.values.length - 1].value, lbg: getLightnessValue(high.terminal[0]) },
        ];

        const expectedOrder = [...samples]; // low -> mid -> high delta
        const sorted = [...samples].sort((a, b) => {
          const da = Math.abs(getLightnessValue(a.hex) - a.lbg);
          const db = Math.abs(getLightnessValue(b.hex) - b.lbg);
          const diff = da - db;
          if (Math.abs(diff) <= EPS) throw new Error("Tie in contrast deltas");
          return diff;
        });
        expect(sorted.map((s) => s.hex)).toEqual(expectedOrder.map((s) => s.hex));
      }
    );

    it.each([9, 12]) (
      "contrast multiplier keeps expected terminal order by lightness delta vs background (index %s)",
      async (termIndex: number) => {
        const low = await generateColorScheme(img, { mode, contrastMultiplier: 0.5 });
        const mid = await generateColorScheme(img, { mode, contrastMultiplier: 1 });
        const high = await generateColorScheme(img, { mode, contrastMultiplier: 1.5 });

        const samples = [
          { hex: low.terminal[termIndex], lbg: getLightnessValue(low.terminal[0]) },
          { hex: mid.terminal[termIndex], lbg: getLightnessValue(mid.terminal[0]) },
          { hex: high.terminal[termIndex], lbg: getLightnessValue(high.terminal[0]) },
        ];

        const expectedOrder = [...samples];
        const sorted = [...samples].sort((a, b) => {
          const da = Math.abs(getLightnessValue(a.hex) - a.lbg);
          const db = Math.abs(getLightnessValue(b.hex) - b.lbg);
          const diff = da - db;
          if (Math.abs(diff) <= EPS) throw new Error("Tie in contrast deltas");
          return diff;
        });
        expect(sorted.map((s) => s.hex)).toEqual(expectedOrder.map((s) => s.hex));
      }
    );
  });
  });
});
