import { describe, it, expect, vi } from 'vitest';
import { generateFromSource } from './generate';
import path from 'node:path';

// Mock colorthief to avoid native image decoding during tests
vi.mock('colorthief', () => {
  return {
    getPalette: async (_src: string, count: number) => {
      const n = Math.max(1, Math.min(count || 24, 24));
      const arr: [number, number, number][] = [];
      for (let i = 0; i < n; i++) {
        arr.push([10 * i % 255, 20 * i % 255, 30 * i % 255]);
      }
      return arr;
    },
  };
});

describe('generateFromSource (local path) with mocked extractor', () => {
  it('returns 16 hex colors', async () => {
    // Use this test file path (exists) to satisfy fs.access in implementation
    const existingPath = path.resolve(__dirname, 'generate.test.ts');
    const colors = await generateFromSource(existingPath, 24);
    expect(Array.isArray(colors)).toBe(true);
    expect(colors.length).toBe(16);
    for (const hex of colors) {
      expect(hex).toMatch(/^#([0-9a-fA-F]{6})$/);
    }
  });
});
