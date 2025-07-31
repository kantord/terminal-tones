'use client';

import { useState, useRef } from 'react';
import { 
  extractColorsFromImage, 
  rgbToHex, 
  cleanupImageUrl, 
  getAvailableFlavors,
  getFlavorColors,
  getFlavorMetadata,
  generateThemeFromImageAndFlavor,
  getGeneratedThemeColors,
  type RGB,
  type FlavorName,
  type GeneratedTheme
} from '@terminal-tones/theme-generator';

export function FileUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [extractedColors, setExtractedColors] = useState<RGB[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [selectedFlavor, setSelectedFlavor] = useState<FlavorName | null>(null);
  const [generatedTheme, setGeneratedTheme] = useState<GeneratedTheme | null>(null);
  const [displayColors, setDisplayColors] = useState<RGB[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableFlavors = getAvailableFlavors();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const generateTheme = (imageColors: RGB[], flavorName: FlavorName) => {
    console.log('Generating theme from image and flavor:', flavorName);
    
    try {
      const theme = generateThemeFromImageAndFlavor(imageColors, flavorName);
      const themeColors = getGeneratedThemeColors(theme);
      
      setGeneratedTheme(theme);
      setDisplayColors(themeColors);
      setIsUploaded(true);
    } catch (error) {
      console.error('Error generating theme:', error);
      // Still show uploaded state with just the extracted colors
      setDisplayColors(imageColors);
      setIsUploaded(true);
    } finally {
      setIsProcessing(false); // Always stop the loading spinner
    }
  };

  const handleFileUpload = async (file: File) => {
    console.log('Processing file:', file.name);
    setIsProcessing(true);
    setUploadedFileName(file.name);
    
    try {
      const result = await extractColorsFromImage(file, 16);
      
      setExtractedColors(result.colors);
      setUploadedImageUrl(result.imageUrl);
      
      // If a flavor is already selected, generate the theme immediately
      if (selectedFlavor) {
        generateTheme(result.colors, selectedFlavor);
      } else {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error extracting colors:', error);
      setIsProcessing(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    // Clean up the object URL
    cleanupImageUrl(uploadedImageUrl);
    
    setIsUploaded(false);
    setExtractedColors([]);
    setIsProcessing(false);
    setUploadedImageUrl('');
    setUploadedFileName('');
    setSelectedFlavor(null);
    setGeneratedTheme(null);
    setDisplayColors([]);
  };

  const handleFlavorSelect = (flavorName: FlavorName) => {
    setSelectedFlavor(flavorName);
    
    // If we already have extracted colors from an image, generate the theme
    if (extractedColors.length > 0) {
      generateTheme(extractedColors, flavorName);
    }
  };

  if (isProcessing) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-gray-600 dark:text-gray-400 mb-4">
          Extracting colors from image...
        </div>
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isUploaded) {
    return (
      <div className="text-center py-12">
        <div className="text-2xl font-semibold text-green-600 dark:text-green-400 mb-6">
          Custom theme generated!
        </div>
        
        {generatedTheme && (
          <div className="mb-8">
            <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6">
              <div className="text-lg font-medium text-gray-800 dark:text-gray-200">
                {generatedTheme.scheme}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {generatedTheme.author}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Mapping score: {generatedTheme.mappingScore.toFixed(2)} (lower is better)
              </div>
            </div>
          </div>
        )}

        {selectedFlavor && (
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
              Base Flavor:
            </h3>
            <div className="flex justify-center">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {getFlavorMetadata(selectedFlavor)?.scheme}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  by {getFlavorMetadata(selectedFlavor)?.author}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {uploadedImageUrl && (
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
              Source Image:
            </h3>
            <div className="flex justify-center mb-2">
              <img
                src={uploadedImageUrl}
                alt="Uploaded image"
                className="max-w-xs max-h-64 rounded-lg shadow-md border border-gray-200 dark:border-gray-600"
                data-testid="uploaded-image"
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {uploadedFileName}
            </p>
          </div>
        )}
        
        {displayColors.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
              Generated Theme Colors:
            </h3>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              {displayColors.map((color, index) => {
                const hex = rgbToHex(color[0], color[1], color[2]);
                const baseNames = ['base00', 'base01', 'base02', 'base03', 'base04', 'base05', 'base06', 'base07', 'base08', 'base09', 'base0A', 'base0B', 'base0C', 'base0D', 'base0E', 'base0F'];
                return (
                  <div key={index} className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 mb-2"
                      style={{ backgroundColor: hex }}
                      data-testid={`color-${index}`}
                    />
                    <div className="text-xs font-mono text-gray-700 dark:text-gray-300 font-semibold">
                      {baseNames[index]}
                    </div>
                    <div className="text-xs font-mono text-gray-600 dark:text-gray-400">
                      {hex}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Create Another Theme
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Flavor Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300 text-center">
          Step 1: Choose a Base Color Flavor
        </h3>
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {availableFlavors.map((flavorName) => {
            const metadata = getFlavorMetadata(flavorName);
            const isSelected = selectedFlavor === flavorName;
            return (
              <button
                key={flavorName}
                onClick={() => handleFlavorSelect(flavorName)}
                className={`
                  px-6 py-3 rounded-lg border-2 transition-all duration-200
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }
                `}
              >
                <div className="text-sm font-medium">{metadata?.scheme}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">by {metadata?.author}</div>
              </button>
            );
          })}
        </div>
        
        {selectedFlavor && (
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
              ✓ Flavor selected: {getFlavorMetadata(selectedFlavor)?.scheme}
            </div>
          </div>
        )}
        
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 my-6">
          {selectedFlavor ? "Now upload an image to generate your custom theme!" : "Select a flavor to continue"}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300 text-center">
          Step 2: Upload Your Image
        </h3>
      </div>

      <div
        className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-colors
          ${!selectedFlavor 
            ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 cursor-not-allowed opacity-60' 
            : isDragOver 
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 cursor-pointer' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer'
          }
        `}
        onDragOver={selectedFlavor ? handleDragOver : undefined}
        onDragLeave={selectedFlavor ? handleDragLeave : undefined}
        onDrop={selectedFlavor ? handleDrop : undefined}
        onClick={selectedFlavor ? handleClick : undefined}
        data-testid="file-upload-area"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
          data-testid="file-input"
          disabled={!selectedFlavor}
        />
        
        <div className="text-4xl mb-4">📁</div>
        <p className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
          {selectedFlavor 
            ? "Drop an image here or click to browse" 
            : "Select a flavor first to upload an image"
          }
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {selectedFlavor 
            ? "Supports PNG, JPG, and other image formats"
            : "Choose a base flavor above to enable image upload"
          }
        </p>
      </div>
    </div>
  );
} 