import { okhslToHex, type OkhslColor } from "@terminal-tones/theme-generator";

interface ColorSwatchProps {
  colors: OkhslColor[];
  title?: string;
}

export function ColorSwatch({ colors, title = "Color Palette" }: ColorSwatchProps) {
  if (colors.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
        {title}
      </h3>
      
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-3">
        {colors.map((color, index) => {
          const hexColor = okhslToHex(color);
          
          return (
            <div key={index} className="group relative">
              <div
                className="w-full aspect-square rounded-lg shadow-md border border-gray-200 dark:border-gray-600 cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: hexColor }}
                title={`Color ${index + 1}: ${hexColor}\nOKHSL(${color.h?.toFixed(0) || 0}, ${(color.s * 100).toFixed(0)}%, ${(color.l * 100).toFixed(0)}%)`}
                onClick={() => navigator.clipboard.writeText(hexColor)}
              />
              <div className="text-xs text-center mt-1 text-gray-500 dark:text-gray-400 font-mono">
                {hexColor}
              </div>
              <div className="text-xs text-center text-gray-400 dark:text-gray-500">
                #{index + 1}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        Click any color to copy its hex value • {colors.length} colors total
      </div>
    </div>
  );
}
