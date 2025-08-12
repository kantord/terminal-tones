"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle } from "lucide-react";
import { ColorSwatch } from "@/components/ColorSwatch";
import { extractColorsFromImage, getBestColorScheme, REFERENCE_PALETTE_DARK, REFERENCE_PALETTE_LIGHT, type OkhslColor, optimizeColorscheme } from "@terminal-tones/theme-generator";
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
  const [bgL, setBgL] = useState<number>(0.08);
  const [fgL, setFgL] = useState<number>(0.9);
  const [optimizedTheme, setOptimizedTheme] = useState<OkhslColor[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to generate theme based on current palette preference
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
      const reference = isLightTheme ? REFERENCE_PALETTE_LIGHT : REFERENCE_PALETTE_DARK;
      const tuned = optimizeColorscheme(base, reference, {
        backgroundLightness: bgL,
        foregroundLightness: fgL,
        isLightTheme,
      });
      setOptimizedTheme(tuned);
    } else {
      setOptimizedTheme([]);
    }
  };

  const deriveLightnessDefaults = (base: OkhslColor[]) => {
    if (base.length < 16) {
      return { bg: bgL, fg: fgL };
    }
    const l0 = base[0]?.l ?? 0;
    const l15 = base[15]?.l ?? 1;
    const isIndex0Black = l0 <= l15;
    let bg = isIndex0Black ? l0 : l15;
    // Foreground: derive from BRIGHT color slots average to avoid pure white (l=1)
    const brightIndices = [9, 10, 11, 12, 13, 14];
    const brightLs = brightIndices
      .map((i) => base[i]?.l)
      .filter((v): v is number => typeof v === "number");
    const avgBright = brightLs.length
      ? brightLs.reduce((a, b) => a + b, 0) / brightLs.length
      : isIndex0Black ? l15 : l0;
    // Nudge away from extremes
    let fg = Math.max(0.02, Math.min(0.98, avgBright));
    // Ensure usable separation; expand range if palette extremes are too close
    if (fg - bg < 0.35) {
      bg = Math.min(bg, 0.12);
      fg = Math.max(fg, 0.9);
    }
    // Clamp final
    bg = Math.max(0, Math.min(1, bg));
    fg = Math.max(0, Math.min(1, fg));
    return { bg, fg };
  };

  // Handle theme toggle change
  const handleThemeToggle = (checked: boolean) => {
    setIsLightTheme(checked);
    
    // Regenerate theme if we have extracted colors
    if (extractedColors.length > 0) {
      const newTheme = generateTheme(extractedColors, checked);
      setGeneratedTheme(newTheme);
      // Reset sliders based on the new theme extremes
      const { bg, fg } = deriveLightnessDefaults(newTheme);
      setBgL(bg);
      setFgL(fg);
      // Compute optimized theme
      if (newTheme.length === 16) {
        const reference = checked ? REFERENCE_PALETTE_LIGHT : REFERENCE_PALETTE_DARK;
        const tuned = optimizeColorscheme(newTheme, reference, {
          backgroundLightness: bg,
          foregroundLightness: fg,
          isLightTheme: checked,
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
      const theme = generateTheme(result.colors, isLightTheme);
      setGeneratedTheme(theme);
      if (theme.length === 16) {
        const reference = isLightTheme ? REFERENCE_PALETTE_LIGHT : REFERENCE_PALETTE_DARK;
        const { bg, fg } = deriveLightnessDefaults(theme);
        setBgL(bg);
        setFgL(fg);
        const tuned = optimizeColorscheme(theme, reference, {
          backgroundLightness: bg,
          foregroundLightness: fg,
          isLightTheme,
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
                    Optimize Lightness
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">Background lightness</label>
                        <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">{bgL.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={bgL}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setBgL(v);
                          if (generatedTheme.length === 16) {
                            const reference = isLightTheme ? REFERENCE_PALETTE_LIGHT : REFERENCE_PALETTE_DARK;
                            const tuned = optimizeColorscheme(generatedTheme, reference, {
                              backgroundLightness: v,
                              foregroundLightness: fgL,
                              isLightTheme,
                            });
                            setOptimizedTheme(tuned);
                          }
                        }}
                        className="w-full h-2 appearance-none bg-gray-200 dark:bg-gray-700 rounded-lg"
                        aria-label="Background lightness"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">Foreground lightness</label>
                        <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">{fgL.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={fgL}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setFgL(v);
                          if (generatedTheme.length === 16) {
                            const reference = isLightTheme ? REFERENCE_PALETTE_LIGHT : REFERENCE_PALETTE_DARK;
                            const tuned = optimizeColorscheme(generatedTheme, reference, {
                              backgroundLightness: bgL,
                              foregroundLightness: v,
                              isLightTheme,
                            });
                            setOptimizedTheme(tuned);
                          }
                        }}
                        className="w-full h-2 appearance-none bg-gray-200 dark:bg-gray-700 rounded-lg"
                        aria-label="Foreground lightness"
                      />
                    </div>
                  </div>
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
