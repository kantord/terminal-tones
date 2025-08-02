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

/**
 * Resize an image to have a maximum side length of 120px
 * Returns a new image element with the resized image, or the original if resizing fails
 */
function resizeImage(originalImg: HTMLImageElement, maxSize: number = 120): HTMLImageElement {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      // Canvas not available (e.g., in test environment), return original image
      console.warn('Canvas context not available, using original image size');
      return originalImg;
    }
    
    // Calculate new dimensions while maintaining aspect ratio
    const { width: originalWidth, height: originalHeight } = originalImg;
    
    // If image is already small enough, return original
    if (originalWidth <= maxSize && originalHeight <= maxSize) {
      return originalImg;
    }
    
    const aspectRatio = originalWidth / originalHeight;
    
    let newWidth: number;
    let newHeight: number;
    
    if (originalWidth > originalHeight) {
      // Width is the larger dimension
      newWidth = Math.min(maxSize, originalWidth);
      newHeight = newWidth / aspectRatio;
    } else {
      // Height is the larger dimension
      newHeight = Math.min(maxSize, originalHeight);
      newWidth = newHeight * aspectRatio;
    }
    
    // Set canvas size to new dimensions
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Draw the resized image
    ctx.drawImage(originalImg, 0, 0, newWidth, newHeight);
    
    // Create a new image element from the canvas
    const resizedImg = new Image();
    resizedImg.src = canvas.toDataURL('image/png');
    
    return resizedImg;
  } catch (error) {
    // If resizing fails for any reason, return original image
    console.warn('Image resizing failed, using original image:', error);
    return originalImg;
  }
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
        // Resize image to maximum 120px on largest side for faster processing
        const resizedImg = resizeImage(img, 120);
        
        // If resizing returned the original image (e.g., in test environment), process directly
        if (resizedImg === img) {
          const colorThief = new ColorThief();
          const palette = colorThief.getPalette(img, colorCount) as RGB[];
          
          resolve({
            colors: palette,
            imageUrl: imageUrl // Keep original image URL for display
          });
          return;
        }
        
        // Wait for the resized image to load, then extract colors
        resizedImg.onload = () => {
          try {
            const colorThief = new ColorThief();
            // Extract colors from the resized image
            const palette = colorThief.getPalette(resizedImg, colorCount) as RGB[];
            
            resolve({
              colors: palette,
              imageUrl: imageUrl // Keep original image URL for display
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
        
        resizedImg.onerror = () => {
          // Clean up on error
          URL.revokeObjectURL(imageUrl);
          reject({
            error: 'Failed to process resized image',
            imageUrl: undefined
          } as ColorExtractionError);
        };
      } catch (error) {
        // Clean up on error
        URL.revokeObjectURL(imageUrl);
        reject({
          error: error instanceof Error ? error.message : 'Unknown error during image resizing',
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