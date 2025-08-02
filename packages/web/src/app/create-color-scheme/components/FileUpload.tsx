'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, Contrast, Code2 } from 'lucide-react';
// No flavor combobox needed anymore
import { SyntaxPreview } from '@/components/SyntaxPreview';
import { 
  extractColorsFromImage, 
  rgbToHex, 
  cleanupImageUrl, 
  generateThemeFromImage,
  getGeneratedThemeColors,
  generateEnhancedTheme,
  getEnhancedThemeColors,
  findOptimalAnsiColorPairing,
  BRIGHT_ANSI_COLORS,
  ANSI_COLOR_NAMES,
  type RGB,
  type GeneratedTheme,
  type EnhancedTheme,
  type ColorVariant,
  type OptimalPairingResult
} from '@terminal-tones/theme-generator';

export function FileUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [extractedColors, setExtractedColors] = useState<RGB[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [generatedTheme, setGeneratedTheme] = useState<GeneratedTheme | null>(null);
  const [enhancedTheme, setEnhancedTheme] = useState<EnhancedTheme | null>(null);
  const [displayColors, setDisplayColors] = useState<RGB[]>([]);
  const [ansiPairing, setAnsiPairing] = useState<OptimalPairingResult | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const generateTheme = (imageColors: RGB[]) => {
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
      
      const themeColors = getEnhancedThemeColors(enhanced);
      
      setGeneratedTheme(theme);
      setEnhancedTheme(enhanced);
      setAnsiPairing(pairingResult);
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
    setDisplayColors([]);
    setSelectedLanguage('javascript');
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
                    <div>• Selected indices: [{ansiPairing.selectedIndices.join(', ')}]</div>
                    <div>• Minimized sum of pairwise perceptual distances</div>
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