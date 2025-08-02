import { describe, it, expect } from 'vitest';
import { findBestMatchingFlavor, generateThemeFromImageAndFlavor } from './themeGeneration';
import { getAvailableFlavors } from './flavors';
import { generateEnhancedTheme, getEnhancedThemeColors } from './colorVariants';
import type { RGB } from './colorExtraction';

// Mock performance.now() for consistent timing
if (typeof performance === 'undefined') {
  (global as any).performance = {
    now: () => Date.now()
  };
}

describe('Performance Profiling', () => {
  it('should profile individual operations', async () => {
    console.log('🔍 Starting Detailed Performance Profiling...\n');
    
    // Get available flavors (first 5 for detailed testing)
    const allFlavors = getAvailableFlavors();
    const testFlavors = allFlavors.slice(0, 5);
    console.log(`📋 Testing with ${testFlavors.length} flavors: ${testFlavors.join(', ')}`);
    
    // Create mock extracted colors (RGB tuples)
    const mockExtractedColors: RGB[] = [
      [45, 55, 72],    // Dark blue-gray
      [88, 101, 242],  // Blue
      [156, 207, 216], // Light blue
      [255, 199, 95],  // Yellow
      [237, 135, 150], // Pink
      [151, 209, 129], // Green
      [245, 169, 127], // Orange
      [198, 160, 246]  // Purple
    ];
    
    console.log(`🎨 Mock extracted colors: ${mockExtractedColors.length}`);
    
    // Test individual operations with first flavor
    const testFlavor = testFlavors[0];
    const testContrast = 1.0;
    
    console.log(`\n🧪 Testing individual operations with: ${testFlavor}`);
    
    // 1. Base theme generation
    console.time('1️⃣ Base theme generation');
    const baseTheme = generateThemeFromImageAndFlavor(mockExtractedColors, testFlavor);
    console.timeEnd('1️⃣ Base theme generation');
    console.log(`   Generated theme: ${baseTheme.scheme}`);
    
    // 2. Enhanced theme generation
    console.time('2️⃣ Enhanced theme generation');
    const enhancedTheme = generateEnhancedTheme(baseTheme, testContrast);
    console.timeEnd('2️⃣ Enhanced theme generation');
    console.log(`   Enhanced theme has ${Object.keys(enhancedTheme).length} properties`);
    
    // 3. Color extraction
    console.time('3️⃣ Enhanced color extraction');
    const enhancedColors = getEnhancedThemeColors(enhancedTheme);
    console.timeEnd('3️⃣ Enhanced color extraction');
    console.log(`   Extracted ${enhancedColors.length} colors`);
    
    // 4. Full comparison - we'll use the built-in functions through the main API
    console.log(`   Colors extracted successfully for comparison`);
    
    // Now test full workflow
    console.log('\n🚀 Testing full workflow...');
    console.time('🎯 Full findBestMatchingFlavor');
    const result = await findBestMatchingFlavor(mockExtractedColors, testFlavors);
    console.timeEnd('🎯 Full findBestMatchingFlavor');
    
    console.log(`\n🏆 Final result: ${result.flavorName} @ ${result.contrastLevel}x (score: ${result.score.toFixed(2)})`);
    
    // Basic assertions
    expect(result).toBeDefined();
    expect(result.flavorName).toBeTruthy();
    expect(result.contrastLevel).toBeGreaterThan(0);
    expect(result.score).not.toBe(Infinity); // Should not be Infinity
    expect(result.score).toBeGreaterThan(0); // Should be a positive number
    
    console.log('\n✅ Detailed profiling completed!');
  }, 60000);
});