import { describe, it, expect } from 'vitest';
import { 
  getAvailableFlavors, 
  getFlavor, 
  getFlavorColors, 
  getFlavorMetadata,
  type FlavorName 
} from './flavors';

describe('getAvailableFlavors', () => {
  it('should return an array of available flavor names', () => {
    const flavors = getAvailableFlavors();
    expect(flavors).toBeInstanceOf(Array);
    expect(flavors.length).toBeGreaterThan(0);
    expect(flavors).toContain('fruit-soda');
    expect(flavors).toContain('rose-pine');
  });

  it('should return exactly 2 flavors for now', () => {
    const flavors = getAvailableFlavors();
    expect(flavors).toHaveLength(2);
  });
});

describe('getFlavor', () => {
  it('should return the Fruit Soda flavor', () => {
    const flavor = getFlavor('fruit-soda');
    expect(flavor).toBeTruthy();
    expect(flavor?.scheme).toBe('Fruit Soda');
    expect(flavor?.author).toBe('jozip');
    expect(flavor?.base00).toBe('f1ecf1');
    expect(flavor?.base0F).toBe('b16f40');
  });

  it('should return the Rose Pine flavor', () => {
    const flavor = getFlavor('rose-pine');
    expect(flavor).toBeTruthy();
    expect(flavor?.scheme).toBe('Rosé Pine');
    expect(flavor?.author).toBe('Emilia Dunfelt <edun@dunfelt.se>');
    expect(flavor?.slug).toBe('rose-pine');
    expect(flavor?.base00).toBe('191724');
    expect(flavor?.base0F).toBe('524f67');
  });

  it('should return null for unknown flavor', () => {
    const flavor = getFlavor('unknown-flavor' as FlavorName);
    expect(flavor).toBeNull();
  });
});

describe('getFlavorColors', () => {
  it('should return 16 RGB color tuples for Fruit Soda', () => {
    const colors = getFlavorColors('fruit-soda');
    expect(colors).toHaveLength(16);
    
    // Check that each color is an RGB tuple
    colors.forEach(color => {
      expect(color).toHaveLength(3);
      expect(typeof color[0]).toBe('number');
      expect(typeof color[1]).toBe('number');
      expect(typeof color[2]).toBe('number');
      // Check RGB values are in valid range
      expect(color[0]).toBeGreaterThanOrEqual(0);
      expect(color[0]).toBeLessThanOrEqual(255);
      expect(color[1]).toBeGreaterThanOrEqual(0);
      expect(color[1]).toBeLessThanOrEqual(255);
      expect(color[2]).toBeGreaterThanOrEqual(0);
      expect(color[2]).toBeLessThanOrEqual(255);
    });

    // Test specific color conversions
    expect(colors[0]).toEqual([241, 236, 241]); // base00: f1ecf1
    expect(colors[15]).toEqual([177, 111, 64]); // base0F: b16f40
  });

  it('should return 16 RGB color tuples for Rose Pine', () => {
    const colors = getFlavorColors('rose-pine');
    expect(colors).toHaveLength(16);
    
    // Test specific color conversions
    expect(colors[0]).toEqual([25, 23, 36]); // base00: 191724
    expect(colors[15]).toEqual([82, 79, 103]); // base0F: 524f67
  });

  it('should throw error for unknown flavor', () => {
    expect(() => {
      getFlavorColors('unknown-flavor' as FlavorName);
    }).toThrow('Flavor "unknown-flavor" not found');
  });
});

describe('getFlavorMetadata', () => {
  it('should return metadata for Fruit Soda without colors', () => {
    const metadata = getFlavorMetadata('fruit-soda');
    expect(metadata).toBeTruthy();
    expect(metadata?.scheme).toBe('Fruit Soda');
    expect(metadata?.author).toBe('jozip');
    expect(metadata?.slug).toBeUndefined();
    
    // Should not have base color properties
    expect(metadata).not.toHaveProperty('base00');
    expect(metadata).not.toHaveProperty('base0F');
  });

  it('should return metadata for Rose Pine with slug', () => {
    const metadata = getFlavorMetadata('rose-pine');
    expect(metadata).toBeTruthy();
    expect(metadata?.scheme).toBe('Rosé Pine');
    expect(metadata?.author).toBe('Emilia Dunfelt <edun@dunfelt.se>');
    expect(metadata?.slug).toBe('rose-pine');
  });

  it('should return null for unknown flavor', () => {
    const metadata = getFlavorMetadata('unknown-flavor' as FlavorName);
    expect(metadata).toBeNull();
  });
});

describe('hexToRgb conversion (implicit testing)', () => {
  it('should correctly convert hex colors to RGB', () => {
    // Test through getFlavorColors
    const colors = getFlavorColors('fruit-soda');
    
    // Test various hex conversions
    expect(colors[8]).toEqual([254, 62, 49]); // base08: fe3e31 -> RGB(254, 62, 49)
    expect(colors[10]).toEqual([247, 226, 3]); // base0A: f7e203 -> RGB(247, 226, 3)
    expect(colors[11]).toEqual([71, 247, 76]); // base0B: 47f74c -> RGB(71, 247, 76)
  });
}); 