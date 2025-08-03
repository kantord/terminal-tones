/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { extractColorsFromImage, type ColorExtractionResult } from './colorExtraction'

// Mock ColorThief since we can't easily test the actual image processing in unit tests
vi.mock('colorthief', () => ({
  default: class MockColorThief {
    getPalette(img: HTMLImageElement, colorCount: number) {
      // Return a mock palette based on the colorCount
      const mockPalette = []
      for (let i = 0; i < colorCount; i++) {
        // Generate some predictable test colors
        mockPalette.push([
          (i * 30) % 256,
          (i * 60) % 256, 
          (i * 90) % 256
        ])
      }
      return mockPalette
    }
  }
}))

describe('extractColorsFromImage - Integration Tests', () => {
  // Mock global Image constructor
  beforeEach(() => {
    global.Image = class MockImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      crossOrigin: string = ''
      src: string = ''

      constructor() {
        // Simulate successful image loading after a short delay
        setTimeout(() => {
          if (this.onload) {
            this.onload()
          }
        }, 10)
      }
    } as any

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn((file: File) => `blob:http://localhost:3000/${file.name}`)
    global.URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should extract colors from a valid image file', async () => {
    const mockFile = new File(['mock image data'], 'test-image.png', { type: 'image/png' })
    
    const result: ColorExtractionResult = await extractColorsFromImage(mockFile, 8)
    
    expect(result).toBeDefined()
    expect(result.colors).toHaveLength(8)
    expect(result.imageUrl).toBe('blob:http://localhost:3000/test-image.png')
    
    // Verify the colors are Okhsl objects
    result.colors.forEach(color => {
      expect(color).toHaveProperty('mode', 'okhsl')
      expect(typeof color.l).toBe('number')
      expect(typeof color.s).toBe('number')
      // h property might be undefined for achromatic colors (gray/black/white)
      if (color.h !== undefined) {
        expect(typeof color.h).toBe('number')
      }
    })

    // Verify URL methods were called
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockFile)
  })

  it('should extract a different number of colors when specified', async () => {
    const mockFile = new File(['mock image data'], 'test-image.jpg', { type: 'image/jpeg' })
    
    const result = await extractColorsFromImage(mockFile, 5)
    
    expect(result.colors).toHaveLength(5)
    expect(result.imageUrl).toBe('blob:http://localhost:3000/test-image.jpg')
  })

  it('should use default color count of 16 when not specified', async () => {
    const mockFile = new File(['mock image data'], 'test.png', { type: 'image/png' })
    
    const result = await extractColorsFromImage(mockFile)
    
    expect(result.colors).toHaveLength(16)
  })

  it('should handle image loading errors', async () => {
    // Override the Image mock to simulate an error
    global.Image = class MockImageError {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      crossOrigin: string = ''
      src: string = ''

      constructor() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror()
          }
        }, 10)
      }
    } as any

    const mockFile = new File(['invalid image data'], 'invalid.png', { type: 'image/png' })
    
    await expect(extractColorsFromImage(mockFile, 8))
      .rejects
      .toMatchObject({
        error: 'Failed to load image'
      })

    // Verify cleanup was called
    expect(global.URL.revokeObjectURL).toHaveBeenCalled()
  })

  // Note: ColorThief error handling is tested implicitly through the try-catch structure
  // and the image loading error test covers the main error flow patterns
}) 