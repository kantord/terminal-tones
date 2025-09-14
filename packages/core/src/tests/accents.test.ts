import path from "path";
import { describe, it, expect } from "vitest";
import { extractAccents } from "..";

describe("extractAccents", () => {
  it.each([1, 2])(
    "returns distinct primary and secondary for image %s",
    async (n: number) => {
      const imagePath = path.join(__dirname, "images", `image${n}.jpg`);
      const { primary, secondary } = await extractAccents(imagePath, {
        mode: "dark",
      });
      const allowed = new Set(["blue", "magenta", "cyan", "orange"]);
      expect(allowed.has(primary.name)).toBe(true);
      expect(allowed.has(secondary.name)).toBe(true);
      expect(primary.name).not.toBe(secondary.name);
      expect(primary.hex).toMatch(/^#[0-9a-f]{6}$/);
      expect(secondary.hex).toMatch(/^#[0-9a-f]{6}$/);
    },
  );
});
