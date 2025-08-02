import type { Metadata } from "next";
import { FileUpload } from "./components/FileUpload";

export const metadata: Metadata = {
  title: "Create Color Scheme - Terminal Tones",
  description: "Create and customize your terminal color scheme",
};

export default function CreateColorScheme() {
  return (
    <div className="font-sans min-h-screen p-4">
      <main className="max-w-full mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Create Color Scheme
        </h1>
        <FileUpload />
      </main>
    </div>
  );
} 