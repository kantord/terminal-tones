import ColorThief from 'colorthief';

export type RGB = [number, number, number];

export interface ColorExtractionResult {
  colors: RGB[];
  imageUrl: string;
}

export interface ColorExtractionError {
  error: string;
  imageUrl?: string;
}

export function extractColorsFromImage(
  file: File,
  colorCount: number = 16
): Promise<ColorExtractionResult> {
  return new Promise((resolve, reject) => {
    // Create a URL for the file and load it into an image
    const imageUrl = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        // Extract the specified number of colors
        const palette = colorThief.getPalette(img, colorCount) as RGB[];
        
        resolve({
          colors: palette,
          imageUrl: imageUrl
        });
      } catch (error) {
        // Clean up on error
        URL.revokeObjectURL(imageUrl);
        reject({
          error: error instanceof Error ? error.message : 'Unknown error during color extraction',
          imageUrl: undefined
        } as ColorExtractionError);
      }
    };
    
    img.onerror = () => {
      // Clean up on error
      URL.revokeObjectURL(imageUrl);
      reject({
        error: 'Failed to load image',
        imageUrl: undefined
      } as ColorExtractionError);
    };
    
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
  });
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

export function cleanupImageUrl(imageUrl: string): void {
  if (imageUrl) {
    URL.revokeObjectURL(imageUrl);
  }
} 