import path from "path";
import { describe, it, expect } from "vitest";
import { generateColorScheme } from "..";
import { converter } from "culori";

const toOkhsl = converter("okhsl") as (c: string) => { l?: number };

function getLightnessValue(hex: string): number {
  return toOkhsl(hex).l ?? 0;
}

describe("Modes: light vs dark", () => {
  it.each([1, 2])("light mode background is lighter than dark for image %s", async (n: number) => {
    const img = path.join(__dirname, "images", `image${n}.jpg`);
    const dark = await generateColorScheme(img, { mode: "dark" });
    const light = await generateColorScheme(img, { mode: "light" });
    const lDark = getLightnessValue(dark.contrastColors[0].background);
    const lLight = getLightnessValue(light.contrastColors[0].background);
    expect(lLight).toBeGreaterThan(lDark);
  });
});

