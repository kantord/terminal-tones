import { describe, it, expect } from 'vitest'
import * as themeGenerator from './index'

describe('Theme Generator Package Exports', () => {
  it('should export all required functions', () => {
    expect(themeGenerator.rgbToHex).toBeDefined()
    expect(themeGenerator.cleanupImageUrl).toBeDefined()
    expect(themeGenerator.extractColorsFromImage).toBeDefined()
  })

  it('should export all required types', () => {
    // TypeScript compilation will fail if types are not exported correctly
    // This test ensures the exports are working
    const testRgb: themeGenerator.RGB = [255, 0, 0]
    expect(testRgb).toEqual([255, 0, 0])
  })

  it('should have rgbToHex function working through main export', () => {
    const result = themeGenerator.rgbToHex(255, 165, 0)
    expect(result).toBe('#ffa500') // Orange
  })
}) 