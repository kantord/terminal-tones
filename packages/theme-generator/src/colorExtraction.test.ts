import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { rgbToHex, cleanupImageUrl, type RGB } from './colorExtraction'

describe('rgbToHex', () => {
  it('should convert RGB values to hex format', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000')
    expect(rgbToHex(0, 255, 0)).toBe('#00ff00')
    expect(rgbToHex(0, 0, 255)).toBe('#0000ff')
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff')
    expect(rgbToHex(0, 0, 0)).toBe('#000000')
  })

  it('should handle single digit hex values correctly', () => {
    expect(rgbToHex(15, 15, 15)).toBe('#0f0f0f')
    expect(rgbToHex(1, 2, 3)).toBe('#010203')
  })

  it('should handle mid-range values correctly', () => {
    expect(rgbToHex(128, 128, 128)).toBe('#808080')
    expect(rgbToHex(192, 192, 192)).toBe('#c0c0c0')
  })

  it('should handle edge cases', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000')
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff')
  })
})

describe('cleanupImageUrl', () => {
  // Mock URL.revokeObjectURL since it's a browser API
  beforeEach(() => {
    global.URL = {
      ...global.URL,
      revokeObjectURL: vi.fn()
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call URL.revokeObjectURL when imageUrl is provided', () => {
    const testUrl = 'blob:http://localhost:3000/test-image'
    cleanupImageUrl(testUrl)
    
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(testUrl)
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
  })

  it('should not call URL.revokeObjectURL when imageUrl is empty', () => {
    cleanupImageUrl('')
    
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })

  it('should not call URL.revokeObjectURL when imageUrl is undefined', () => {
    cleanupImageUrl(undefined as any)
    
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })
})

describe('RGB type', () => {
  it('should accept valid RGB tuples', () => {
    const validRgb: RGB = [255, 128, 0]
    expect(validRgb).toEqual([255, 128, 0])
    expect(validRgb.length).toBe(3)
  })

  it('should work with rgbToHex function', () => {
    const rgb: RGB = [255, 128, 64]
    const hex = rgbToHex(rgb[0], rgb[1], rgb[2])
    expect(hex).toBe('#ff8040')
  })
}) 