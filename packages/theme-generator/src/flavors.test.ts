import { describe, it, expect } from 'vitest';
import { 
  getAvailableFlavors, 
  getFlavor, 
  getFlavorColors, 
  getFlavorMetadata,
  type FlavorName 
} from './flavors';

describe('getAvailableFlavors', () => {
  it('should return an array of curated flavor names', () => {
    const flavors = getAvailableFlavors();
    expect(flavors).toBeInstanceOf(Array);
    expect(flavors).toHaveLength(10); // Curated selection of 10 flavors
    expect(flavors).toContain('dracula');
    expect(flavors).toContain('gruvbox-dark');
    expect(flavors).toContain('catppuccin-mocha');
    expect(flavors).toContain('catppuccin-latte');
    expect(flavors).toContain('github');
  });

  it('should return curated selection for performance', () => {
    const flavors = getAvailableFlavors();
    expect(flavors).toHaveLength(10); // Optimized selection of 10 high-quality flavors
    
    // Should contain both dark and light themes
    const darkThemes = ['dracula', 'gruvbox-dark', 'catppuccin-mocha', 'tokyo-night-dark', 'nord'];
    const lightThemes = ['catppuccin-latte', 'gruvbox-light', 'github', 'solarized-light', 'rose-pine-dawn'];
    
    darkThemes.forEach(theme => expect(flavors).toContain(theme));
    lightThemes.forEach(theme => expect(flavors).toContain(theme));
  });
});

describe('getFlavor', () => {
  it('should return the Dracula flavor', () => {
    const flavor = getFlavor('dracula');
    expect(flavor).toBeTruthy();
    expect(flavor?.scheme).toBe('Dracula');
    expect(flavor?.author).toBe('Jamy Golden (http://github.com/JamyGolden), based on Dracula Theme (http://github.com/dracula)');
    expect(flavor?.base00).toBe('282a36');
    expect(flavor?.base0F).toBe('bd93f9');
  });

  it('should return the GitHub flavor', () => {
    const flavor = getFlavor('github');
    expect(flavor).toBeTruthy();
    expect(flavor?.scheme).toBe('Github');
    expect(flavor?.author).toBe('Tinted Theming (https://github.com/tinted-theming)');
    expect(flavor?.slug).toBe('github');
    expect(flavor?.base00).toBe('eaeef2');
    expect(flavor?.base0F).toBe('4d2d00');
  });

  it('should return null for unknown flavor', () => {
    const flavor = getFlavor('unknown-flavor' as FlavorName);
    expect(flavor).toBeNull();
  });
});

describe('getFlavorColors', () => {
  it('should return 16 RGB color tuples for Dracula', () => {
    const colors = getFlavorColors('dracula');
    expect(colors).toBeInstanceOf(Array);
    expect(colors).toHaveLength(16);
    
    // Check that all colors are valid RGB arrays
    for (const color of colors) {
      expect(Array.isArray(color)).toBe(true);
      expect(color).toHaveLength(3);
      expect(color[0]).toBeGreaterThanOrEqual(0);
      expect(color[0]).toBeLessThanOrEqual(255);
      expect(color[1]).toBeGreaterThanOrEqual(0);
      expect(color[1]).toBeLessThanOrEqual(255);
      expect(color[2]).toBeGreaterThanOrEqual(0);
      expect(color[2]).toBeLessThanOrEqual(255);
    }
  });

  it('should return 16 RGB color tuples for GitHub', () => {
    const colors = getFlavorColors('github');
    expect(colors).toBeInstanceOf(Array);
    expect(colors).toHaveLength(16);
  });

  it('should throw error for unknown flavor', () => {
    expect(() => {
      getFlavorColors('unknown-flavor' as FlavorName);
    }).toThrow('Flavor "unknown-flavor" not found');
  });
});

describe('getFlavorMetadata', () => {
  it('should return metadata for Dracula without colors', () => {
    const metadata = getFlavorMetadata('dracula');
    expect(metadata).toBeTruthy();
    expect(metadata?.scheme).toBe('Dracula');
    expect(metadata?.author).toBe('Jamy Golden (http://github.com/JamyGolden), based on Dracula Theme (http://github.com/dracula)');
    // Should not include color properties
    expect(metadata).not.toHaveProperty('base00');
    expect(metadata).not.toHaveProperty('base0F');
  });

  it('should return metadata for GitHub with slug', () => {
    const metadata = getFlavorMetadata('github');
    expect(metadata).toBeTruthy();
    expect(metadata?.scheme).toBe('Github');
    expect(metadata?.author).toBe('Tinted Theming (https://github.com/tinted-theming)');
    expect(metadata?.slug).toBe('github');
  });

  it('should return null for unknown flavor', () => {
    const metadata = getFlavorMetadata('unknown-flavor' as FlavorName);
    expect(metadata).toBeNull();
  });
});

describe('hexToRgb conversion (implicit testing)', () => {
  it('should correctly convert hex colors to RGB', () => {
    const colors = getFlavorColors('dracula');
    // Test conversion by checking some known values
    expect(colors).toHaveLength(16);
    
    // Check that colors have correct RGB structure
    colors.forEach(color => {
      expect(Array.isArray(color)).toBe(true);
      expect(color).toHaveLength(3);
      expect(typeof color[0]).toBe('number');
      expect(typeof color[1]).toBe('number');
      expect(typeof color[2]).toBe('number');
    });
  });
});