// Re-export everything from individual modules
export * from './extractColorsFromImage';
export * from './colorScheme';
export * from './palette';
export * from './types';
export * from './optimizeColorscheme';
export * from './initialConfig';
export * from './kitty';

// Re-export types from culori that we use
export type { Okhsl as OkhslColor } from 'culori';

// Explicit exports for better clarity
export { 
  default as getBestColorScheme, 
  REFERENCE_PALETTE_DARK, 
  REFERENCE_PALETTE_LIGHT 
} from './colorScheme';
