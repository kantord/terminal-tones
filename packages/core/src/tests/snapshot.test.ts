import path from "path";
import { it, expect, describe } from "vitest";
import { generateColorScheme } from "..";

function isValidHexColor(str: string) {
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(str);
}

describe("generateColorScheme()", () => {
  it.each([1, 2])("returns the correct values", async (n: number) => {
    const imagePath = path.join(__dirname, "images", `image${n}.jpg`);

    const results = await generateColorScheme(imagePath);

    expect(results).toMatchSnapshot();
    expect(results.terminal).toHaveLength(16);

    for (const color of results.terminal) {
      expect(isValidHexColor(color)).toBe(true);
    }
  });
});
