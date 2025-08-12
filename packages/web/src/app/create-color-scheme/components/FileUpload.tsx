"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle } from "lucide-react";
import { ColorSwatch } from "@/components/ColorSwatch";
import { extractColorsFromImage, getBestColorScheme, REFERENCE_PALETTE_DARK, REFERENCE_PALETTE_LIGHT, type OkhslColor, customizeColorScheme, deriveInitialCustomization } from "@terminal-tones/theme-generator";
import SyntaxPreview from "@/components/SyntaxPreview";
import { Switch } from "@/components/ui/switch";

export function FileUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [extractedColors, setExtractedColors] = useState<OkhslColor[]>([]);
  const [generatedTheme, setGeneratedTheme] = useState<OkhslColor[]>([]);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isLightTheme, setIsLightTheme] = useState<boolean>(false);
  const [blackPoint, setBlackPoint] = useState<number | null>(null);
  const [whitePoint, setWhitePoint] = useState<number | null>(null);
  const [dynamicRange, setDynamicRange] = useState<number | null>(null);
  const [optimizedTheme, setOptimizedTheme] = useState<OkhslColor[]>([]);
  const [midpoint, setMidpoint] = useState<number | null>(0.5);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to generate theme based on selected palette
  const generateTheme = (colors: OkhslColor[], useLightPalette: boolean) => {
    const palette = useLightPalette ? REFERENCE_PALETTE_LIGHT : REFERENCE_PALETTE_DARK;
    if (colors.length >= palette.length) {
      return getBestColorScheme(colors, palette);
    } else {
      console.warn(`Need at least ${palette.length} colors for theme generation, got ${colors.length}`);
      return [];
    }
  };

  // Recompute optimized theme whenever base theme or sliders change
  const recomputeOptimized = (base: OkhslColor[]) => {
    if (base.length === 16) {
      if (blackPoint === null || whitePoint === null) {
        setOptimizedTheme([]);
        return;
      }
      const reference = isLightTheme ? REFERENCE_PALETTE_LIGHT : REFERENCE_PALETTE_DARK;
      const range = Math.max(1e-6, whitePoint - blackPoint);
      const midParam = ((blackPoint + whitePoint) / 2 - blackPoint) / range;
      const tuned = customizeColorScheme(base, reference, {
        blackPointLightness: blackPoint,
        whitePointLightness: whitePoint,
        midpoint: midParam,
      });
      setOptimizedTheme(tuned);
    } else {
      setOptimizedTheme([]);
    }
  };

  const deriveLightnessDefaults = (base: OkhslColor[]) => {
    if (base.length < 16) {
      return { bg: null, fg: null } as { bg: number | null; fg: number | null };
    }
    const firstL = Math.max(0, Math.min(1, base[0]?.l ?? 0));
    const lastL = Math.max(0, Math.min(1, base[base.length - 1]?.l ?? 1));
    // For light themes, darkest is at the last index; invert assignment
    const bg = isLightTheme ? lastL : firstL; // black point
    const fg = isLightTheme ? firstL : lastL; // white point
    return { bg, fg };
  };

  // Handle theme toggle change
  const handleThemeToggle = (checked: boolean) => {
    setIsLightTheme(checked);
    
    // Regenerate theme if we have extracted colors
    if (extractedColors.length > 0) {
      const newTheme = generateTheme(extractedColors, checked);
      setGeneratedTheme(newTheme);
      // Re-derive default black/white points from the new theme using backend logic
      if (newTheme.length === 16) {
        const ref = checked ? REFERENCE_PALETTE_LIGHT : REFERENCE_PALETTE_DARK;
        const init = deriveInitialCustomization(newTheme, ref);
        setBlackPoint(init.blackPointLightness);
        setWhitePoint(init.whitePointLightness);
      }
      // Compute optimized theme
      if (newTheme.length === 16) {
        const reference = checked ? REFERENCE_PALETTE_LIGHT : REFERENCE_PALETTE_DARK;
        const init = deriveInitialCustomization(newTheme, reference);
        const range2 = Math.max(1e-6, init.whitePointLightness - init.blackPointLightness);
        const midParam2 = (((init.blackPointLightness + init.whitePointLightness) / 2) - init.blackPointLightness) / range2;
        const tuned = customizeColorScheme(newTheme, reference, {
          blackPointLightness: init.blackPointLightness,
          whitePointLightness: init.whitePointLightness,
          midpoint: midParam2,
        });
        setOptimizedTheme(tuned);
      } else {
        setOptimizedTheme([]);
      }
    }
  };

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

  const handleFileUpload = async (file: File) => {
    console.log("Processing file:", file.name);
    setUploadedFileName(file.name);
    
    // Create URL for displaying the image
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    
    try {
      const result = await extractColorsFromImage(file, 24);
      setExtractedColors(result.colors);
      
      // Generate theme using current palette preference
      // Always generate the initial theme using the dark reference palette
      const theme = getBestColorScheme(result.colors, REFERENCE_PALETTE_DARK);
      setGeneratedTheme(theme);
      if (theme.length === 16) {
        const init = deriveInitialCustomization(theme, REFERENCE_PALETTE_DARK);
        setBlackPoint(init.blackPointLightness);
        setWhitePoint(init.whitePointLightness);
        const range = Math.max(1e-6, init.whitePointLightness - init.blackPointLightness);
        const midParam = (((init.blackPointLightness + init.whitePointLightness) / 2) - init.blackPointLightness) / range;
        const tuned = customizeColorScheme(theme, REFERENCE_PALETTE_DARK, {
          blackPointLightness: init.blackPointLightness,
          whitePointLightness: init.whitePointLightness,
          midpoint: midParam,
        });
        setOptimizedTheme(tuned);
      } else {
        setOptimizedTheme([]);
      }
      
      setIsUploaded(true);
    } catch (error) {
      console.error("Error extracting colors:", error);
      // Still show uploaded state even if color extraction fails
      setIsUploaded(true);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setIsUploaded(false);
    setUploadedFileName("");
    setExtractedColors([]);
    setGeneratedTheme([]);
    setOptimizedTheme([]);
    // Clean up the image URL to prevent memory leaks
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl("");
    }
  };

  if (isUploaded) {
    return (
      <div className="py-12 max-w-4xl mx-auto">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 mb-8">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-semibold text-green-600 dark:text-green-400 mb-4">
              Success!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Extracted 24 colors from <strong>{uploadedFileName}</strong>
            </p>
            <button
              onClick={handleReset}
              className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Upload Another Image
            </button>
          </div>
        </div>

        {imageUrl && (
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
                Uploaded Image
              </h3>
              <div className="flex justify-center">
                <img 
                  src={imageUrl} 
                  alt={`Uploaded file: ${uploadedFileName}`}
                  className="max-w-full max-h-96 object-contain rounded-lg shadow-md border border-gray-200 dark:border-gray-600"
                />
              </div>
            </div>
          </div>
        )}

        {extractedColors.length > 0 && (
          <div className="space-y-6">
            <ColorSwatch 
              colors={extractedColors} 
              title="Extracted Colors (24 colors)" 
            />
            
            {generatedTheme.length > 0 && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Theme Style
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Choose between dark or light terminal theme
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`text-sm ${!isLightTheme ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                        Dark
                      </span>
                      <Switch
                        checked={isLightTheme}
                        onCheckedChange={handleThemeToggle}
                      />
                      <span className={`text-sm ${isLightTheme ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                        Light
                      </span>
                    </div>
                  </div>
                </div>
                
                <ColorSwatch 
                  colors={generatedTheme} 
                  title={`Generated Terminal Theme (${isLightTheme ? 'Light' : 'Dark'} - 16 colors)`}
                />

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
                    Syntax highlighting preview
                  </h3>
                  <SyntaxPreview okhslBase16={generatedTheme} language="typescript" />
                </div>

                {/* Optimizer controls */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
                    Optimize Lightness (Black/White points)
                  </h3>

                  {blackPoint !== null && whitePoint !== null ? (
                    <div className="space-y-6">
                      {/* Midpoint slider (edits black/white symmetrically) */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-gray-600 dark:text-gray-400">Midpoint</label>
                          <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">{(((blackPoint + whitePoint) / 2) ).toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={(blackPoint + whitePoint) / 2}
                          onChange={(e) => {
                            const desiredMid = Number(e.target.value);
                            // Keep current range length; recenter around desired midpoint
                            const currentRange = Math.max(0, whitePoint - blackPoint);
                            let newBlack = desiredMid - currentRange / 2;
                            let newWhite = desiredMid + currentRange / 2;
                            if (newBlack < 0 && newWhite > 1) {
                              newBlack = 0; newWhite = 1;
                            } else if (newBlack < 0) {
                              const shift = -newBlack; newBlack = 0; newWhite = Math.min(1, newWhite + shift);
                            } else if (newWhite > 1) {
                              const shift = newWhite - 1; newWhite = 1; newBlack = Math.max(0, newBlack - shift);
                            }
                            setBlackPoint(newBlack);
                            setWhitePoint(newWhite);
                            if (generatedTheme.length === 16) {
                              const reference = isLightTheme ? REFERENCE_PALETTE_LIGHT : REFERENCE_PALETTE_DARK;
                              const range = Math.max(1e-6, newWhite - newBlack);
                              const midParam = (desiredMid - newBlack) / range;
                              const tuned = customizeColorScheme(generatedTheme, reference, {
                                blackPointLightness: newBlack,
                                whitePointLightness: newWhite,
                                midpoint: midParam,
                              });
                              setOptimizedTheme(tuned);
                            }
                          }}
                          className="w-full h-2 appearance-none bg-gray-200 dark:bg-gray-700 rounded-lg"
                          aria-label="Midpoint"
                        />
                      </div>

                      {/* Dynamic range slider (changes distance, preserves midpoint) */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-gray-600 dark:text-gray-400">Dynamic range</label>
                          <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">{(whitePoint - blackPoint).toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={whitePoint - blackPoint}
                          onChange={(e) => {
                            const desired = Number(e.target.value);
                            const mid = (blackPoint + whitePoint) / 2;
                            let newBlack = mid - desired / 2;
                            let newWhite = mid + desired / 2;
                            // Keep range within [0,1] while preserving distance if possible
                            if (newBlack < 0 && newWhite > 1) {
                              newBlack = 0;
                              newWhite = 1;
                            } else if (newBlack < 0) {
                              const shift = -newBlack;
                              newBlack = 0;
                              newWhite = Math.min(1, newWhite + shift);
                            } else if (newWhite > 1) {
                              const shift = newWhite - 1;
                              newWhite = 1;
                              newBlack = Math.max(0, newBlack - shift);
                            }
                            setBlackPoint(newBlack);
                            setWhitePoint(newWhite);
                            if (generatedTheme.length === 16) {
                              const reference = isLightTheme ? REFERENCE_PALETTE_LIGHT : REFERENCE_PALETTE_DARK;
                              const midParam = (mid - newBlack) / Math.max(1e-6, desired);
                              const tuned = customizeColorScheme(generatedTheme, reference, {
                                blackPointLightness: newBlack,
                                whitePointLightness: newWhite,
                                midpoint: midParam,
                              });
                              setOptimizedTheme(tuned);
                            }
                          }}
                          className="w-full h-2 appearance-none bg-gray-200 dark:bg-gray-700 rounded-lg"
                          aria-label="Dynamic range"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-gray-600 dark:text-gray-400">Black point</label>
                          <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">{blackPoint.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={blackPoint}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setBlackPoint(v);
                            if (generatedTheme.length === 16) {
                              const reference = isLightTheme ? REFERENCE_PALETTE_LIGHT : REFERENCE_PALETTE_DARK;
                              const tuned = customizeColorScheme(generatedTheme, reference, {
                                blackPointLightness: v,
                                whitePointLightness: whitePoint,
                              });
                              setOptimizedTheme(tuned);
                            }
                            setDynamicRange(Math.max(0, Math.min(1, whitePoint - v)));
                          }}
                          className="w-full h-2 appearance-none bg-gray-200 dark:bg-gray-700 rounded-lg"
                          aria-label="Black point"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-gray-600 dark:text-gray-400">White point</label>
                          <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">{whitePoint.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={whitePoint}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setWhitePoint(v);
                            if (generatedTheme.length === 16) {
                              const reference = isLightTheme ? REFERENCE_PALETTE_LIGHT : REFERENCE_PALETTE_DARK;
                              const tuned = customizeColorScheme(generatedTheme, reference, {
                                blackPointLightness: blackPoint,
                                whitePointLightness: v,
                              });
                              setOptimizedTheme(tuned);
                            }
                            setDynamicRange(Math.max(0, Math.min(1, v - blackPoint)));
                          }}
                          className="w-full h-2 appearance-none bg-gray-200 dark:bg-gray-700 rounded-lg"
                          aria-label="White point"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Generate a theme to adjust lightness.</p>
                  )}
                </div>

                {optimizedTheme.length === 16 && (
                  <div className="space-y-4">
                    <ColorSwatch 
                      colors={optimizedTheme} 
                      title={`Optimized Theme (L tuned)`}
                    />

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
                        Optimized syntax preview
                      </h3>
                      <SyntaxPreview okhslBase16={optimizedTheme} language="typescript" />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
                Raw Color Data (JSON)
              </h3>
              <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-auto">
                <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {JSON.stringify(extractedColors, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8">
        <div className="mb-8">
          <h3 className="text-2xl font-medium mb-4 text-gray-700 dark:text-gray-300 text-center">
            Upload Your Image
          </h3>
          <p className="text-center text-base text-gray-500 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Upload an image and we&apos;ll show you a success message
          </p>
        </div>

        <div
          className={`
            border-2 border-dashed rounded-lg p-16 text-center cursor-pointer transition-colors max-w-2xl mx-auto
            ${
              isDragOver
                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
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
