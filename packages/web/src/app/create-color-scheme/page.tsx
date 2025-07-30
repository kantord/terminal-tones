import type { Metadata } from "next";
import { FileUpload } from "./components/FileUpload";

export const metadata: Metadata = {
  title: "Create Color Scheme - Terminal Tones",
  description: "Create and customize your terminal color scheme",
};

export default function CreateColorScheme() {
  return (
    <div className="font-sans min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Create Color Scheme
        </h1>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 text-center">
            Upload an image to generate a color scheme
          </p>
          <FileUpload />
        </div>
      </main>
    </div>
  );
} 