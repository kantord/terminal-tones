'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, Code2 } from 'lucide-react';
// No flavor combobox needed anymore
import { SyntaxPreview } from '@/components/SyntaxPreview';
import { 
  extractColorsFromImage, 
  cleanupImageUrl, 
  generateThemeFromImage,
  generateEnhancedTheme,
  getEnhancedThemeColors,
  findOptimalAnsiColorPairing,
  generateLeonardoVariants,
  okhslToRgb,
  type RGB,
  type OkhslColor,
  type GeneratedTheme,
  type EnhancedTheme,
  type OptimalPairingResult,
  type LeonardoVariantsResult
} from '@terminal-tones/theme-generator';

export function FileUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [extractedColors, setExtractedColors] = useState<OkhslColor[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [generatedTheme, setGeneratedTheme] = useState<GeneratedTheme | null>(null);
  const [enhancedTheme, setEnhancedTheme] = useState<EnhancedTheme | null>(null);
  // displayColors removed as it was unused after Okhsl conversion
  const [ansiPairing, setAnsiPairing] = useState<OptimalPairingResult | null>(null);
  const [leonardoVariants, setLeonardoVariants] = useState<LeonardoVariantsResult | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [backgroundLuminosity, setBackgroundLuminosity] = useState<number>(0.5); // 0 = sharp (dark), 1 = smooth (bright)

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to adjust background luminosity and regenerate Leonardo variants
  const adjustBackgroundLuminosity = (colors: OkhslColor[], luminosity: number) => {
    if (!colors.length || !ansiPairing) return colors;
    
    // Find the background color index (paired with black, ANSI index 0)
    const backgroundIndex = ansiPairing.selectedIndices[0];
    const backgroundColor = colors[backgroundIndex];
    
    // Create adjusted background color with new luminosity
    const adjustedBackground: OkhslColor = {
      ...backgroundColor,
      l: luminosity // Set luminosity directly (0 = sharp/dark, 1 = smooth/bright)
    };
    
    // Return colors with adjusted background
    const adjustedColors = [...colors];
    adjustedColors[backgroundIndex] = adjustedBackground;
    
    return adjustedColors;
  };

// No flavors needed anymore

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

  const generateTheme = (imageColors: OkhslColor[]) => {
    console.log('Generating theme from image colors');
    
    try {
      // Simplified approach - use 16 colors directly
      if (imageColors.length < 16) {
        throw new Error(`Expected at least 16 colors, got ${imageColors.length}`);
      }
      
      const theme = generateThemeFromImage(imageColors);
      console.log('Base theme generated:', theme);
      
      const enhanced = generateEnhancedTheme(theme);
      console.log('Enhanced theme generated:', enhanced);
      
      // Find optimal ANSI color pairing
      const pairingResult = findOptimalAnsiColorPairing(imageColors);
      console.log('ANSI color pairing result:', pairingResult);
      
      // Apply initial luminosity adjustment to background color
      const adjustedColors = adjustBackgroundLuminosity(imageColors, backgroundLuminosity);
      
      // Generate Leonardo variants with adjusted colors
      const leonardoResult = generateLeonardoVariants(pairingResult, adjustedColors);
      console.log('Leonardo variants result:', leonardoResult);
      
      setGeneratedTheme(theme);
      setEnhancedTheme(enhanced);
      setAnsiPairing(pairingResult);
      setLeonardoVariants(leonardoResult);
      setIsUploaded(true);
    } catch (error) {
      console.error('Error generating theme:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : String(error));
      // Still show uploaded state with just the extracted colors
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
      
      // Generate theme directly from extracted colors
      generateTheme(result.colors);
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
    setGeneratedTheme(null);
    setEnhancedTheme(null);
    setAnsiPairing(null);
    setLeonardoVariants(null);
    setSelectedLanguage('javascript');
    setBackgroundLuminosity(0.5);
  };

  // Handle luminosity slider changes
  const handleLuminosityChange = (newLuminosity: number) => {
    setBackgroundLuminosity(newLuminosity);
    
    if (extractedColors.length > 0 && ansiPairing) {
      // Adjust colors with new luminosity
      const adjustedColors = adjustBackgroundLuminosity(extractedColors, newLuminosity);
      
      // Regenerate Leonardo variants with adjusted colors
      const leonardoResult = generateLeonardoVariants(ansiPairing, adjustedColors);
      setLeonardoVariants(leonardoResult);
    }
  };

  // No flavor selection needed anymore

  if (isProcessing) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-gray-600 dark:text-gray-400 mb-4">
          {uploadedImageUrl ? 'Generating new theme...' : 'Extracting colors from image...'}
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
            
            <div className="mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Direct Color Extraction
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Colors are extracted directly from your image and used exactly as found - no flavor templates needed!
                </p>
              </div>
            </div>

            {/* Contrast adjustment removed - simplified approach doesn't use complex contrast calculations */}
            
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

            {/* Background Luminosity Control */}
            {leonardoVariants && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
                  Background Tone Control
                </h3>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <label htmlFor="bg-luminosity-slider" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Background Tone
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {(backgroundLuminosity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Sharp</span>
                    <input
                      id="bg-luminosity-slider"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={backgroundLuminosity}
                      onChange={(e) => handleLuminosityChange(parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer range-slider"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Smooth</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Adjust the perceived brightness of the background color to create sharper or smoother contrast.
                  </p>
                  <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                    <strong>Current Background:</strong> {leonardoVariants.backgroundColor}
                  </div>
                </div>
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
                terminalColors={leonardoVariants?.terminalColors || null}
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
                  Using extracted colors directly in order
                </div>
              </div>
            </div>
          )}
          
          {enhancedTheme && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium mb-6 text-gray-700 dark:text-gray-300">
                Extracted Color Palette (16 Colors)
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Colors extracted directly from your image in order, mapped to Base16 positions.
                </p>
                
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {enhancedTheme.allColorsHex.map((color, index) => {
                    const baseNames = [
                      'base00', 'base01', 'base02', 'base03', 
                      'base04', 'base05', 'base06', 'base07',
                      'base08', 'base09', 'base0A', 'base0B', 
                      'base0C', 'base0D', 'base0E', 'base0F'
                    ];
                    
                    return (
                      <div key={index} className="text-center">
                        <div
                          className="w-16 h-16 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 mb-2"
                          style={{ backgroundColor: color }}
                          data-testid={index === 0 ? "color-0" : undefined}
                        />
                        <div className="text-xs font-mono text-gray-600 dark:text-gray-400">
                          {color}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {baseNames[index]}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Simplified Approach
                  </h4>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>• 16 colors extracted directly from image</div>
                    <div>• No complex optimization or contrast calculations</div>
                    <div>• Colors used exactly as extracted, in order</div>
                    <div>• Fast generation with instant results</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {ansiPairing && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mt-6">
              <h3 className="text-lg font-medium mb-6 text-gray-700 dark:text-gray-300">
                Base ANSI Terminal Color Pairing
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Optimal pairing of 8 extracted colors with standard base ANSI terminal colors.
                  <br />
                  <span className="text-xs text-gray-500">
                    Total perceptual distance: {ansiPairing.totalDistance.toFixed(2)} (lower is better)
                  </span>
                </p>
                
                <div className="space-y-3">
                  {ansiPairing.pairings.map((pairing, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {/* ANSI Color */}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg shadow-md border border-gray-200 dark:border-gray-600"
                          style={{ backgroundColor: `rgb(${pairing.ansiColor.join(',')})` }}
                        />
                        <div className="text-sm">
                          <div className="font-medium text-gray-700 dark:text-gray-300">
                            {pairing.ansiColorName}
                          </div>
                          <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
                            rgb({pairing.ansiColor.join(',')})
                          </div>
                        </div>
                      </div>
                      
                      {/* Arrow */}
                      <div className="text-gray-400 dark:text-gray-500">→</div>
                      
                      {/* Extracted Color */}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg shadow-md border border-gray-200 dark:border-gray-600"
                          style={{ backgroundColor: pairing.extractedColorHex }}
                        />
                        <div className="text-sm">
                          <div className="font-medium text-gray-700 dark:text-gray-300">
                            Extracted Color
                          </div>
                          <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
                            {pairing.extractedColorHex}
                          </div>
                        </div>
                      </div>
                      
                      {/* Distance */}
                      <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                        Δ{pairing.perceptualDistance.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Algorithm Details
                  </h4>
                  <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <div>• Tested all C(16,8) = {((16*15*14*13*12*11*10*9)/(8*7*6*5*4*3*2*1)).toLocaleString()} combinations</div>
                    <div>• Used CIEDE2000 perceptual color difference formula</div>
                    <div>• <strong>Hue penalty</strong> added for semantic colors (Red, Green, Yellow)</div>
                    <div>• Selected indices: [{ansiPairing.selectedIndices.join(', ')}]</div>
                    <div>• Minimized perceptual + hue distance for semantic colors</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leonardo Contrast Variants Section */}
          {leonardoVariants && (
            <div className="mb-8">
              <h3 className="text-xl font-medium mb-4 text-gray-700 dark:text-gray-300">
                Leonardo Contrast Variants
              </h3>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Background:</strong> {leonardoVariants.backgroundColor} (matched with black)
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <strong>Foreground:</strong> {leonardoVariants.foregroundColor} (matched with white)
                  </p>
                </div>

                <div className="space-y-6">
                  {leonardoVariants.accentVariants.map((accent, index) => (
                    <div key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="w-8 h-8 rounded border shadow-sm"
                          style={{ backgroundColor: accent.originalColor }}
                        />
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {accent.colorName} ({accent.originalColor})
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {accent.variants.length} variants
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                        {accent.variants.map((variant, variantIndex) => (
                          <div key={variantIndex} className="group relative">
                            <div 
                              className="w-full h-12 rounded border shadow-sm cursor-pointer hover:scale-105 transition-transform"
                              style={{ backgroundColor: variant.value }}
                              title={`${variant.name}: ${variant.value} (${variant.contrast.toFixed(1)}:1)`}
                              onClick={() => navigator.clipboard.writeText(variant.value)}
                            />
                            <div className="text-xs text-center mt-1 text-gray-500 dark:text-gray-400">
                              {variant.contrast.toFixed(1)}:1
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Generated 16 Terminal Colors */}
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-3">
                    Generated 16 Terminal Colors
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Normal Colors (0-7) */}
                    <div>
                      <h5 className="text-xs font-medium text-green-800 dark:text-green-200 mb-2">
                        Normal Colors (0-7) - 4.5:1 Contrast
                      </h5>
                      <div className="grid grid-cols-8 gap-1">
                        {leonardoVariants.terminalColors.normal.map((color, index) => (
                          <div key={index} className="group relative">
                            <div 
                              className="w-full h-10 rounded border shadow-sm cursor-pointer hover:scale-105 transition-transform"
                              style={{ backgroundColor: color }}
                              title={`Color ${index}: ${color}`}
                              onClick={() => navigator.clipboard.writeText(color)}
                            />
                            <div className="text-xs text-center mt-1 text-gray-500 dark:text-gray-400">
                              {index}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Bright Colors (8-15) */}
                    <div>
                      <h5 className="text-xs font-medium text-green-800 dark:text-green-200 mb-2">
                        Bright Colors (8-15) - 8:1 Contrast
                      </h5>
                      <div className="grid grid-cols-8 gap-1">
                        {leonardoVariants.terminalColors.bright.map((color, index) => (
                          <div key={index} className="group relative">
                            <div 
                              className="w-full h-10 rounded border shadow-sm cursor-pointer hover:scale-105 transition-transform"
                              style={{ backgroundColor: color }}
                              title={`Color ${index + 8}: ${color}`}
                              onClick={() => navigator.clipboard.writeText(color)}
                            />
                            <div className="text-xs text-center mt-1 text-gray-500 dark:text-gray-400">
                              {index + 8}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-green-700 dark:text-green-300">
                    <div>• Color 0: Original background, Color 8: 6.0:1 background variant</div>
                    <div>• Colors 1-7: 4.5:1 contrast variants of matched colors</div>
                    <div>• Colors 9-15: 8:1 contrast variants of matched colors</div>
                    <div>• Click any color to copy hex value</div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                    Leonardo Details
                  </h4>
                  <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                    <div>• Background from ANSI black pairing, foreground from ANSI white pairing</div>
                    <div>• 10 contrast variants per accent color (1.5:1 to 18:1)</div>
                    <div>• LCH colorspace interpolation for perceptual uniformity</div>
                    <div>• Total variants: {leonardoVariants.totalVariants}</div>
                    <div>• Click any color to copy hex value</div>
                  </div>
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