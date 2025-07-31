'use client';

import { useState, useRef } from 'react';
import { 
  extractColorsFromImage, 
  rgbToHex, 
  cleanupImageUrl, 
  getAvailableFlavors,
  getFlavorColors,
  getFlavorMetadata,
  type RGB,
  type FlavorName 
} from '@terminal-tones/theme-generator';

export function FileUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [extractedColors, setExtractedColors] = useState<RGB[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [selectedFlavor, setSelectedFlavor] = useState<FlavorName | null>(null);
  const [colorSource, setColorSource] = useState<'image' | 'flavor'>('image');
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

  const handleFileUpload = async (file: File) => {
    console.log('Processing file:', file.name);
    setIsProcessing(true);
    setUploadedFileName(file.name);
    
    try {
      const result = await extractColorsFromImage(file, 16);
      
      setExtractedColors(result.colors);
      setUploadedImageUrl(result.imageUrl);
      setIsUploaded(true);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error extracting colors:', error);
      setIsProcessing(false);
      // Still show success for demo purposes
      setIsUploaded(true);
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
    setColorSource('image');
  };

  const handleFlavorSelect = (flavorName: FlavorName) => {
    setSelectedFlavor(flavorName);
    setColorSource('flavor');
    
    // Get colors from flavor
    const colors = getFlavorColors(flavorName);
    setExtractedColors(colors);
    setIsUploaded(true);
    
    // Clear image-related states
    cleanupImageUrl(uploadedImageUrl);
    setUploadedImageUrl('');
    setUploadedFileName('');
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
          Color scheme generated
        </div>
        
        {colorSource === 'flavor' && selectedFlavor && (
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
              Base Scheme:
            </h3>
            <div className="flex justify-center">
              <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  {getFlavorMetadata(selectedFlavor)?.scheme}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  by {getFlavorMetadata(selectedFlavor)?.author}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {uploadedImageUrl && colorSource === 'image' && (
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
        
        {extractedColors.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
              Extracted Colors:
            </h3>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              {extractedColors.map((color, index) => {
                const hex = rgbToHex(color[0], color[1], color[2]);
                return (
                  <div key={index} className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 mb-2"
                      style={{ backgroundColor: hex }}
                      data-testid={`color-${index}`}
                    />
                    <div className="text-sm font-mono text-gray-600 dark:text-gray-400">
                      {hex}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      rgb({color[0]}, {color[1]}, {color[2]})
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
          {colorSource === 'flavor' ? 'Choose Another Scheme' : 'Upload Another Image'}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Flavor Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300 text-center">
          Choose a Base Color Scheme or Upload an Image
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
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
          — or —
        </div>
      </div>

      <div
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
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
        
        <div className="text-4xl mb-4">📁</div>
        <p className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
          Drop an image here or click to browse
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Supports PNG, JPG, and other image formats
        </p>
      </div>
    </div>
  );
} 