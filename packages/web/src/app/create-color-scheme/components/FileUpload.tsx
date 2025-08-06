"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle } from "lucide-react";
import { ColorSwatch } from "@/components/ColorSwatch";
import { extractColorsFromImage, type OkhslColor } from "@terminal-tones/theme-generator";

export function FileUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [extractedColors, setExtractedColors] = useState<OkhslColor[]>([]);
  const [imageUrl, setImageUrl] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

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
