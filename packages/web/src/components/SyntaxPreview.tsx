'use client';

import { useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import type { GeneratedTheme, EnhancedTheme } from '@terminal-tones/theme-generator';

interface SyntaxPreviewProps {
  theme: GeneratedTheme;
  enhancedTheme?: EnhancedTheme | null;
  language?: string;
  code?: string;
}

// Sample code for different languages
const SAMPLE_CODE = {
  javascript: `// React component with hooks
import React, { useState, useEffect } from 'react';

function ColorSchemeGenerator({ image }) {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (image) {
      extractColors(image).then(setColors);
    }
  }, [image]);
  
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const theme = await generateTheme(colors);
      return theme;
    } catch (error) {
      console.error('Failed to generate theme:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="color-generator">
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Theme'}
      </button>
    </div>
  );
}`,

  typescript: `// TypeScript interface and implementation
interface ThemeConfig {
  background: string;
  foreground: string;
  accent: string[];
}

class ThemeGenerator<T extends ThemeConfig> {
  private config: T;
  
  constructor(config: T) {
    this.config = config;
  }
  
  public generateCSS(): string {
    const { background, foreground, accent } = this.config;
    
    return \`
      :root {
        --bg: \${background};
        --fg: \${foreground};
        \${accent.map((color, i) => \`--accent-\${i}: \${color};\`).join('\\n')}
      }
    \`;
  }
  
  public async saveTheme(name: string): Promise<boolean> {
    try {
      const css = this.generateCSS();
      await fetch('/api/themes', {
        method: 'POST',
        body: JSON.stringify({ name, css }),
        headers: { 'Content-Type': 'application/json' }
      });
      return true;
    } catch (error) {
      console.error('Save failed:', error);
      return false;
    }
  }
}`,

  python: `# Color extraction and theme generation
import numpy as np
from PIL import Image
from sklearn.cluster import KMeans
from typing import List, Tuple

class ColorExtractor:
    """Extract dominant colors from images using K-means clustering."""
    
    def __init__(self, n_colors: int = 16):
        self.n_colors = n_colors
        self.kmeans = KMeans(n_clusters=n_colors, random_state=42)
    
    def extract_colors(self, image_path: str) -> np.ndarray:
        """Extract dominant colors from an image."""
        image = Image.open(image_path)
        image = image.convert('RGB')
        
        # Reshape image to list of RGB values
        pixels = np.array(image).reshape(-1, 3)
        
        # Find clusters
        self.kmeans.fit(pixels)
        colors = self.kmeans.cluster_centers_
        
        return colors.astype(int)
    
    def generate_theme(self, colors: np.ndarray, flavor: str = 'monokai') -> dict:
        """Generate a terminal theme from extracted colors."""
        theme = {
            'name': f'{flavor}_custom',
            'background': f'#{colors[0][0]:02x}{colors[0][1]:02x}{colors[0][2]:02x}',
            'foreground': f'#{colors[-1][0]:02x}{colors[-1][1]:02x}{colors[-1][2]:02x}',
            'accent_colors': [
                f'#{c[0]:02x}{c[1]:02x}{c[2]:02x}' for c in colors[1:-1]
            ]
        }
        return theme`,

  css: `/* Base16 Theme Styles */
.theme-container {
  background-color: var(--base00);
  color: var(--base05);
  font-family: 'Fira Code', monospace;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.syntax-highlighting {
  /* Comments */
  .hljs-comment,
  .hljs-quote {
    color: var(--base03);
    font-style: italic;
  }
  
  /* Keywords */
  .hljs-keyword,
  .hljs-selector-tag,
  .hljs-type {
    color: var(--base0E);
    font-weight: bold;
  }
  
  /* Strings */
  .hljs-string,
  .hljs-meta-string {
    color: var(--base0B);
  }
  
  /* Numbers */
  .hljs-number,
  .hljs-literal {
    color: var(--base09);
  }
  
  /* Functions */
  .hljs-function,
  .hljs-title {
    color: var(--base0D);
  }
  
  /* Variables */
  .hljs-variable,
  .hljs-template-variable {
    color: var(--base08);
  }
  
  /* Selection */
  ::selection {
    background-color: var(--base02);
  }
}`,

  json: `{
  "name": "terminal-tones-theme",
  "version": "1.0.0",
  "description": "A beautiful color scheme generated from your image",
  "keywords": ["theme", "terminal", "colors", "base16"],
  "colors": {
    "background": "#1a1a1a",
    "foreground": "#f8f8f2",
    "selection": "#44475a",
    "comment": "#6272a4",
    "red": "#ff5555",
    "orange": "#ffb86c",
    "yellow": "#f1fa8c",
    "green": "#50fa7b",
    "cyan": "#8be9fd",
    "blue": "#bd93f9",
    "purple": "#ff79c6",
    "brown": "#d19a66"
  },
  "terminal": {
    "black": "#21222c",
    "red": "#ff5555",
    "green": "#50fa7b",
    "yellow": "#f1fa8c",
    "blue": "#bd93f9",
    "magenta": "#ff79c6",
    "cyan": "#8be9fd",
    "white": "#f8f8f2"
  },
  "ui": {
    "cursor": "#f8f8f0",
    "selection": "#44475a75",
    "lineHighlight": "#44475a75",
    "findMatch": "#ffb86c"
  }
}`,

  rust: `// Rust implementation for color theme generation
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct Color {
    r: u8,
    g: u8,
    b: u8,
}

impl Color {
    fn new(r: u8, g: u8, b: u8) -> Self {
        Self { r, g, b }
    }
    
    fn to_hex(&self) -> String {
        format!("#{:02x}{:02x}{:02x}", self.r, self.g, self.b)
    }
    
    fn luminance(&self) -> f64 {
        let r = self.r as f64 / 255.0;
        let g = self.g as f64 / 255.0;
        let b = self.b as f64 / 255.0;
        
        0.299 * r + 0.587 * g + 0.114 * b
    }
}

#[derive(Debug, Serialize)]
struct Theme {
    name: String,
    colors: HashMap<String, String>,
}

impl Theme {
    fn new(name: String) -> Self {
        Self {
            name,
            colors: HashMap::new(),
        }
    }
    
    fn add_color(&mut self, key: &str, color: &Color) {
        self.colors.insert(key.to_string(), color.to_hex());
    }
    
    fn export_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string_pretty(self)
    }
}`
};

// Helper function to ensure hex color has # prefix
function ensureHexPrefix(color: string): string {
  return color.startsWith('#') ? color : `#${color}`;
}

// Get colors from enhanced theme or fall back to base theme
function getEffectiveColors(theme: GeneratedTheme, enhancedTheme?: EnhancedTheme | null) {
  if (enhancedTheme) {
    // Use enhanced theme colors with contrast adjustments
    return {
      base00: enhancedTheme.backgroundHex,
      base01: enhancedTheme.colorVariants[0]?.variants[1]?.hex || ensureHexPrefix(theme.base01), // Lighter Background
      base02: enhancedTheme.colorVariants[1]?.variants[1]?.hex || ensureHexPrefix(theme.base02), // Selection Background
      base03: enhancedTheme.colorVariants[2]?.variants[2]?.hex || ensureHexPrefix(theme.base03), // Comments - uses 3.0 contrast ratio for better readability
      base04: enhancedTheme.colorVariants[3]?.variants[1]?.hex || ensureHexPrefix(theme.base04), // Dark Foreground
      base05: enhancedTheme.foregroundVariants[2]?.hex || enhancedTheme.foregroundVariants[0]?.hex || ensureHexPrefix(theme.base05),
      base06: enhancedTheme.colorVariants[4]?.variants[1]?.hex || ensureHexPrefix(theme.base06), // Light Foreground
      base07: enhancedTheme.colorVariants[5]?.variants[1]?.hex || ensureHexPrefix(theme.base07), // Light Background
      base08: enhancedTheme.colorVariants[6]?.variants[1]?.hex || ensureHexPrefix(theme.base08), // Variables (red)
      base09: enhancedTheme.colorVariants[7]?.variants[1]?.hex || ensureHexPrefix(theme.base09), // Numbers (orange)
      base0A: enhancedTheme.colorVariants[8]?.variants[1]?.hex || ensureHexPrefix(theme.base0A), // Classes (yellow)
      base0B: enhancedTheme.colorVariants[9]?.variants[1]?.hex || ensureHexPrefix(theme.base0B), // Strings (green)
      base0C: enhancedTheme.colorVariants[10]?.variants[1]?.hex || ensureHexPrefix(theme.base0C), // Support (cyan)
      base0D: enhancedTheme.colorVariants[11]?.variants[1]?.hex || ensureHexPrefix(theme.base0D), // Functions (blue)
      base0E: enhancedTheme.colorVariants[12]?.variants[1]?.hex || ensureHexPrefix(theme.base0E), // Keywords (purple)
      base0F: enhancedTheme.colorVariants[13]?.variants[1]?.hex || ensureHexPrefix(theme.base0F), // Deprecated
    };
  }
  
  // Fall back to base theme colors
  return {
    base00: ensureHexPrefix(theme.base00),
    base01: ensureHexPrefix(theme.base01),
    base02: ensureHexPrefix(theme.base02),
    base03: ensureHexPrefix(theme.base03),
    base04: ensureHexPrefix(theme.base04),
    base05: ensureHexPrefix(theme.base05),
    base06: ensureHexPrefix(theme.base06),
    base07: ensureHexPrefix(theme.base07),
    base08: ensureHexPrefix(theme.base08),
    base09: ensureHexPrefix(theme.base09),
    base0A: ensureHexPrefix(theme.base0A),
    base0B: ensureHexPrefix(theme.base0B),
    base0C: ensureHexPrefix(theme.base0C),
    base0D: ensureHexPrefix(theme.base0D),
    base0E: ensureHexPrefix(theme.base0E),
    base0F: ensureHexPrefix(theme.base0F),
  };
}

// Generate CSS for base16 theme with unique ID
function generateBase16CSS(theme: GeneratedTheme, enhancedTheme: EnhancedTheme | null | undefined, uniqueId: string): string {
  const colors = getEffectiveColors(theme, enhancedTheme);

  return `
    .syntax-preview-${uniqueId} .hljs {
      display: block !important;
      overflow-x: auto !important;
      padding: 1rem !important;
      background: ${colors.base00} !important;
      color: ${colors.base05} !important;
      border-radius: 6px !important;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace !important;
      font-size: 14px !important;
      line-height: 1.5 !important;
      margin: 0 !important;
    }

    .syntax-preview-${uniqueId} .hljs-comment,
    .syntax-preview-${uniqueId} .hljs-quote {
      color: ${colors.base03} !important;
      font-style: italic !important;
    }

    .syntax-preview-${uniqueId} .hljs-variable,
    .syntax-preview-${uniqueId} .hljs-template-variable,
    .syntax-preview-${uniqueId} .hljs-tag,
    .syntax-preview-${uniqueId} .hljs-name,
    .syntax-preview-${uniqueId} .hljs-selector-id,
    .syntax-preview-${uniqueId} .hljs-selector-class,
    .syntax-preview-${uniqueId} .hljs-regexp,
    .syntax-preview-${uniqueId} .hljs-deletion {
      color: ${colors.base08} !important;
    }

    .syntax-preview-${uniqueId} .hljs-number,
    .syntax-preview-${uniqueId} .hljs-built_in,
    .syntax-preview-${uniqueId} .hljs-builtin-name,
    .syntax-preview-${uniqueId} .hljs-literal,
    .syntax-preview-${uniqueId} .hljs-type,
    .syntax-preview-${uniqueId} .hljs-params,
    .syntax-preview-${uniqueId} .hljs-meta,
    .syntax-preview-${uniqueId} .hljs-link {
      color: ${colors.base09} !important;
    }

    .syntax-preview-${uniqueId} .hljs-attribute {
      color: ${colors.base0A} !important;
    }

    .syntax-preview-${uniqueId} .hljs-string,
    .syntax-preview-${uniqueId} .hljs-symbol,
    .syntax-preview-${uniqueId} .hljs-bullet,
    .syntax-preview-${uniqueId} .hljs-addition {
      color: ${colors.base0B} !important;
    }

    .syntax-preview-${uniqueId} .hljs-title,
    .syntax-preview-${uniqueId} .hljs-section {
      color: ${colors.base0D} !important;
    }

    .syntax-preview-${uniqueId} .hljs-keyword,
    .syntax-preview-${uniqueId} .hljs-selector-tag {
      color: ${colors.base0E} !important;
    }

    .syntax-preview-${uniqueId} .hljs-emphasis {
      font-style: italic !important;
    }

    .syntax-preview-${uniqueId} .hljs-strong {
      font-weight: bold !important;
    }
  `;
}

export function SyntaxPreview({ theme, enhancedTheme, language = 'javascript', code }: SyntaxPreviewProps) {
  const codeRef = useRef<HTMLElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useRef(`preview-${Math.random().toString(36).substr(2, 9)}`);

  const sampleCode = code || SAMPLE_CODE[language as keyof typeof SAMPLE_CODE] || SAMPLE_CODE.javascript;

  // Get effective colors (enhanced or base)
  const effectiveColors = getEffectiveColors(theme, enhancedTheme);
  
  // Debug: log theme colors
  console.log('SyntaxPreview theme:', {
    hasEnhanced: !!enhancedTheme,
    base00: effectiveColors.base00,
    base05: effectiveColors.base05,
    base08: effectiveColors.base08,
    base0E: effectiveColors.base0E
  });

  useEffect(() => {
    console.log('SyntaxPreview effect running for:', language, 'enhanced:', !!enhancedTheme);
    
    // Remove existing style
    if (styleRef.current && document.head.contains(styleRef.current)) {
      document.head.removeChild(styleRef.current);
    }
    
    // Create and inject new style
    styleRef.current = document.createElement('style');
    styleRef.current.setAttribute('data-syntax-preview', uniqueId.current);
    const css = generateBase16CSS(theme, enhancedTheme, uniqueId.current);
    styleRef.current.textContent = css;
    document.head.appendChild(styleRef.current);
    
    console.log('Injected CSS with enhanced:', !!enhancedTheme);

    // Highlight code
    if (codeRef.current) {
      // Clear previous highlighting
      codeRef.current.removeAttribute('data-highlighted');
      codeRef.current.className = `language-${language}`;
      
      // Apply highlighting
      hljs.highlightElement(codeRef.current);
      console.log('Highlighted element classes:', codeRef.current.className);
    }

    // Cleanup function
    return () => {
      if (styleRef.current && document.head.contains(styleRef.current)) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, [theme, enhancedTheme, language, sampleCode]);

  // Use effective colors for inline styles
  const safeColors = {
    background: effectiveColors.base00,
    color: effectiveColors.base05,
  };

  return (
    <div ref={containerRef} className={`syntax-preview syntax-preview-${uniqueId.current}`}>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <pre 
          className="m-0"
          style={{
            background: safeColors.background,
            color: safeColors.color,
            padding: '1rem',
            margin: 0,
            fontSize: '14px',
            lineHeight: '1.5',
            fontFamily: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace"
          }}
        >
          <code 
            ref={codeRef} 
            className={`language-${language}`}
            style={{
              background: 'transparent',
              color: 'inherit'
            }}
          >
            {sampleCode}
          </code>
        </pre>
      </div>
      
      {/* Debug info - remove this in production */}
      <div className="text-xs text-gray-500 mt-2">
        Debug: bg={effectiveColors.base00}, fg={effectiveColors.base05}, enhanced={!!enhancedTheme}
      </div>
    </div>
  );
}

export default SyntaxPreview;