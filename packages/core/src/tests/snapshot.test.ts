import path from "path";
import { it, expect, describe } from "vitest";
import { generateColorScheme } from "..";
import { converter } from "culori";

function isValidHexColor(str: string) {
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(str);
}

describe("generateColorScheme()", () => {
  it.each([1, 2])("returns the correct values", async (n: number) => {
    const imagePath = path.join(__dirname, "images", `image${n}.jpg`);

    const results = await generateColorScheme(imagePath, { mode: "dark" });

    expect(results).toMatchSnapshot();
    expect(results.terminal).toHaveLength(16);

    for (const color of results.terminal) {
      expect(isValidHexColor(color)).toBe(true);
    }
  });

  it("applies lightness multiplier to background", async () => {
    const imagePath = path.join(__dirname, "images", `image1.jpg`);
    const toOkhsl = converter("okhsl") as (c: string) => { l?: number };

    const a = await generateColorScheme(imagePath, {
      mode: "dark",
      lightnessMultiplier: 1,
    });
    const b = await generateColorScheme(imagePath, {
      mode: "dark",
      lightnessMultiplier: 2,
    });

    const la = toOkhsl(a.contrastColors[0].background).l ?? 0;
    const lb = toOkhsl(b.contrastColors[0].background).l ?? 0;

    // Increasing multiplier should not decrease background lightness
    expect(lb).toBeGreaterThanOrEqual(la - 1e-6);
    // And should never exceed 1
    expect(lb).toBeLessThanOrEqual(1);

    // Snapshot ensures the structure stays consistent
    expect({
      a: a.contrastColors[0].background,
      b: b.contrastColors[0].background,
    }).toMatchSnapshot();
  });

  it("applies contrast multiplier to ratios", async () => {
    const imagePath = path.join(__dirname, "images", `image1.jpg`);

    const a = await generateColorScheme(imagePath, {
      mode: "dark",
      contrastMultiplier: 1,
    });
    const b = await generateColorScheme(imagePath, {
      mode: "dark",
      contrastMultiplier: 2,
    });

    const getGroup = (name: string, x: any) =>
      x.contrastColors.find((g: any) => "name" in g && g.name === name);

    const redA = getGroup("red", a)!;
    const redB = getGroup("red", b)!;

    const ratiosA = redA.values.map((v: any) => v.contrast);
    const ratiosB = redB.values.map((v: any) => v.contrast);

    expect(ratiosA).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(ratiosB).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18]);
  });
});
