import path from "path";
import { it, expect, describe } from 'vitest';
import { generateColorScheme } from "..";

function isValidHexColor(str) {
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(str);
}

describe('generateColorScheme()', () => {
  it('returns the correct values', async () => {
    const imagePath = path.join(__dirname, "images", "image1.jpg")

    const results = await generateColorScheme(imagePath)

    expect(results).toMatchSnapshot()
    expect(results.terminal).toHaveLength(16)

    for (const color of results.terminal) {
      expect(isValidHexColor(color)).toBe(true)
    }

  })
})
