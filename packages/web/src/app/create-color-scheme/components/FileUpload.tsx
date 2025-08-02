'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, Contrast, Code2 } from 'lucide-react';
import { FlavorCombobox } from '@/components/FlavorCombobox';
import { SyntaxPreview } from '@/components/SyntaxPreview';
import { 
  extractColorsFromImage, 
  rgbToHex, 
  cleanupImageUrl, 
  getAvailableFlavors,
  getFlavorColors,
  getFlavorMetadata,
  generateThemeFromImageAndFlavor,
  getGeneratedThemeColors,
  findBestMatchingFlavor,
  generateEnhancedTheme,
  getEnhancedThemeColors,
  type RGB,
  type FlavorName,
  type GeneratedTheme,
  type EnhancedTheme,
  type ColorVariant,
  type ColorWithVariants,
  type BestFlavorMatch
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
  const [enhancedTheme, setEnhancedTheme] = useState<EnhancedTheme | null>(null);
  const [displayColors, setDisplayColors] = useState<RGB[]>([]);
  const [isAutoSelected, setIsAutoSelected] = useState(false);
  const [contrastLevel, setContrastLevel] = useState(1.0);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');

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
      console.log('Base theme generated:', theme);
      
      const enhanced = generateEnhancedTheme(theme, contrastLevel);
      console.log('Enhanced theme generated:', enhanced);
      console.log('Foreground variants:', enhanced.foregroundVariants);
      console.log('Color variants count:', enhanced.colorVariants.length);
      
      const themeColors = getEnhancedThemeColors(enhanced);
      
      setGeneratedTheme(theme);
      setEnhancedTheme(enhanced);
      setDisplayColors(themeColors);
      setIsUploaded(true);
    } catch (error) {
      console.error('Error generating theme:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : String(error));
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
      const result = await extractColorsFromImage(file, 20);
      
      setExtractedColors(result.colors);
      setUploadedImageUrl(result.imageUrl);
      
      // Find the best matching flavor if none is selected
      let flavorToUse = selectedFlavor;
      let autoSelected = false;
      
      if (!flavorToUse) {
        const bestMatch = await findBestMatchingFlavor(result.colors, availableFlavors);
        flavorToUse = bestMatch.flavorName;
        autoSelected = true;
        console.log(`Auto-selected: ${flavorToUse} (score: ${bestMatch.score.toFixed(2)})`);
      }
      
      setSelectedFlavor(flavorToUse);
      setIsAutoSelected(autoSelected);
      
      // Generate theme with the selected/optimized flavor and contrast
      generateTheme(result.colors, flavorToUse);
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
    setEnhancedTheme(null);
    setDisplayColors([]);
    setIsAutoSelected(false);
    setContrastLevel(1.0);
    setSelectedLanguage('javascript');
  };

  const handleFlavorSelect = (flavorName: FlavorName) => {
    setSelectedFlavor(flavorName);
    setIsAutoSelected(false); // User manually selected this flavor
    
    // If we already have extracted colors from an image, regenerate the theme
    if (extractedColors.length > 0) {
      setIsProcessing(true);
      generateTheme(extractedColors, flavorName);
    }
  };

  const handleContrastChange = (newContrastLevel: number) => {
    setContrastLevel(newContrastLevel);
    
    // If we already have extracted colors and a flavor, regenerate the theme
    if (extractedColors.length > 0 && selectedFlavor) {
      setIsProcessing(true);
      generateTheme(extractedColors, selectedFlavor);
    }
  };

  if (isProcessing) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-gray-600 dark:text-gray-400 mb-4">
          {uploadedImageUrl ? 'Generating new theme...' : 'Extracting colors and finding optimal flavor + contrast combination...'}
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isUploaded) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-full mx-auto">
        {/* Left Column - Customization Options */}
        <div className="space-y-8">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-green-600 dark:text-green-400 mb-6 text-center">
              Custom theme generated!
            </h2>
            
            {selectedFlavor && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
                  Try Different Flavors:
                </h3>
                
                <FlavorCombobox
                  value={selectedFlavor}
                  onValueChange={handleFlavorSelect}
                  placeholder="Select a flavor..."
                  disabled={isProcessing}
                  className="mb-4"
                />
                
                <div className="text-center">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Currently using: {getFlavorMetadata(selectedFlavor)?.scheme}
                    {isAutoSelected && (
                      <span className="ml-2 text-xs opacity-75">(best match)</span>
                    )}
                  </div>
                </div>
                
                <div className="text-center mt-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {availableFlavors.length} professional color schemes available
                  </div>
                </div>
              </div>
            )}

            {enhancedTheme && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Contrast className="w-5 h-5" />
                  Adjust Contrast Level
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem]">Low</span>
                    <div className="flex-1">
                      <input
                        type="range"
                        min="0.1"
                        max="3.0"
                        step="0.05"
                        value={contrastLevel}
                        onChange={(e) => handleContrastChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer range-slider"
                        disabled={isProcessing}
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem]">High</span>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Contrast: <span className="font-mono font-medium">{contrastLevel.toFixed(2)}x</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Multiplier for contrast ratios (0.1 = very subtle, 1.0 = default, 3.0 = high contrast)
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {uploadedImageUrl && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
                  Source Image:
                </h3>
                <div className="flex justify-center mb-2">
                  <img
                    src={uploadedImageUrl}
                    alt="Uploaded image"
                    className="max-w-full max-h-64 rounded-lg shadow-md border border-gray-200 dark:border-gray-600"
                    data-testid="uploaded-image"
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  {uploadedFileName}
                </p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Another Theme
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Preview Content */}
        <div className="space-y-8">
          {generatedTheme && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Code2 className="w-5 h-5" />
                  Syntax Highlighting Preview
                </h3>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="rust">Rust</option>
                  <option value="css">CSS</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <SyntaxPreview 
                theme={generatedTheme}
                enhancedTheme={enhancedTheme}
                language={selectedLanguage}
              />
            </div>
          )}

          {generatedTheme && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
                Theme Information
              </h3>
              <div className="text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
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
          
          {enhancedTheme && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium mb-6 text-gray-700 dark:text-gray-300">
                Enhanced Color Palette with Contrast Variants
              </h3>
              
              {/* Background Color */}
              <div className="mb-8">
                <h4 className="text-md font-medium mb-3 text-gray-600 dark:text-gray-400">
                  Background (base00)
                </h4>
                <div className="flex justify-center">
                  <div className="text-center">
                    <div
                      className="w-20 h-20 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 mb-2"
                      style={{ backgroundColor: enhancedTheme.backgroundHex }}
                    />
                    <div className="text-xs font-mono text-gray-600 dark:text-gray-400">
                      {enhancedTheme.backgroundHex}
                    </div>
                  </div>
                </div>
              </div>

              {/* Foreground Variants */}
              <div className="mb-8">
                <h4 className="text-md font-medium mb-3 text-gray-600 dark:text-gray-400">
                  Foreground (base05) - 8 Contrast Variants
                </h4>
                <div className="flex flex-wrap justify-center gap-3">
                  {enhancedTheme.foregroundVariants.map((variant, index) => (
                    <div key={index} className="text-center">
                      <div
                        className="w-16 h-16 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 mb-2 flex items-center justify-center text-xs font-mono"
                        style={{ 
                          backgroundColor: enhancedTheme.backgroundHex,
                          color: variant.hex
                        }}
                      >
                        Aa
                      </div>
                      <div className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        {variant.hex}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {variant.contrast.toFixed(1)}:1 {variant.wcagLevel}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Variants */}
              <div className="mb-8">
                <h4 className="text-md font-medium mb-4 text-gray-600 dark:text-gray-400">
                  Theme Colors - 8 Contrast Variants Each
                </h4>
                <div className="space-y-6">
                  {enhancedTheme.colorVariants.map((colorGroup, groupIndex) => (
                    <div key={groupIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {colorGroup.baseName}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {colorGroup.baseDescription}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {colorGroup.variants.map((variant, variantIndex) => (
                          <div key={variantIndex} className="text-center">
                            <div
                              className="w-12 h-12 rounded-md shadow-sm border border-gray-200 dark:border-gray-600 mb-1"
                              style={{ backgroundColor: variant.hex }}
                              title={`${variant.contrast.toFixed(1)}:1 ${variant.wcagLevel}`}
                              data-testid={groupIndex === 0 && variantIndex === 0 ? "color-0" : undefined}
                            />
                            <div className="text-xs font-mono text-gray-600 dark:text-gray-400">
                              {variant.hex}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {variant.contrast.toFixed(1)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Color Palette Summary */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Palette Summary
                </h4>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div>• 1 Background color (base00)</div>
                  <div>• 8 Foreground variants with contrast ratios from 1.5:1 to 12:1</div>
                  <div>• 14 Theme colors with 4 variants each (56 total variants)</div>
                  <div>• All variants optimized using Leonardo contrast algorithms</div>
                  <div>• WCAG AA/AAA compliance indicated for accessibility</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8">
        <div className="mb-8">
          <h3 className="text-2xl font-medium mb-4 text-gray-700 dark:text-gray-300 text-center">
            Upload Your Image to Generate a Custom Theme
          </h3>
          <p className="text-center text-base text-gray-500 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            We&apos;ll automatically find the best matching flavor for your image, then you can experiment with different ones
          </p>
        </div>

        <div
          className={`
            border-2 border-dashed rounded-lg p-16 text-center cursor-pointer transition-colors max-w-2xl mx-auto
            ${isDragOver 
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          data-testid="file-upload-area"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
            data-testid="file-input"
          />
          
          <Upload className="w-16 h-16 mx-auto mb-6 text-gray-400 dark:text-gray-500" />
          <p className="text-xl font-medium mb-3 text-gray-700 dark:text-gray-300">
            Drop an image here or click to browse
          </p>
          <p className="text-base text-gray-500 dark:text-gray-400">
            Supports PNG, JPG, and other image formats
          </p>
        </div>
      </div>
    </div>
  );
} 