const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Build script to convert all YAML flavor files into a static TypeScript file
 * This allows the flavors to be bundled for the browser without runtime fs access
 */

const flavorsDir = path.join(__dirname, '../src/flavors');
const outputFile = path.join(__dirname, '../src/generatedFlavors.ts');

function convertBase16ToFlavor(base16, slug) {
  return {
    scheme: base16.name,
    author: base16.author,
    slug: slug,
    base00: base16.palette.base00.replace('#', ''),
    base01: base16.palette.base01.replace('#', ''),
    base02: base16.palette.base02.replace('#', ''),
    base03: base16.palette.base03.replace('#', ''),
    base04: base16.palette.base04.replace('#', ''),
    base05: base16.palette.base05.replace('#', ''),
    base06: base16.palette.base06.replace('#', ''),
    base07: base16.palette.base07.replace('#', ''),
    base08: base16.palette.base08.replace('#', ''),
    base09: base16.palette.base09.replace('#', ''),
    base0A: base16.palette.base0A.replace('#', ''),
    base0B: base16.palette.base0B.replace('#', ''),
    base0C: base16.palette.base0C.replace('#', ''),
    base0D: base16.palette.base0D.replace('#', ''),
    base0E: base16.palette.base0E.replace('#', ''),
    base0F: base16.palette.base0F.replace('#', '')
  };
}

function buildFlavors() {
  console.log('Building flavor database from YAML files...');
  
  try {
    const yamlFiles = fs.readdirSync(flavorsDir)
      .filter(file => file.endsWith('.yaml'))
      .slice(0, 50); // Limit to 50 for performance
    
    console.log(`Processing ${yamlFiles.length} YAML files...`);
    
    const flavors = {};
    let successCount = 0;
    let errorCount = 0;
    
    for (const file of yamlFiles) {
      try {
        const filePath = path.join(flavorsDir, file);
        const yamlContent = fs.readFileSync(filePath, 'utf8');
        const base16Scheme = yaml.load(yamlContent);
        
        if (base16Scheme && base16Scheme.palette) {
          const slug = path.basename(file, '.yaml');
          const flavorScheme = convertBase16ToFlavor(base16Scheme, slug);
          flavors[slug] = flavorScheme;
          successCount++;
        } else {
          console.warn(`Invalid scheme format in ${file}`);
          errorCount++;
        }
      } catch (error) {
        console.warn(`Failed to process ${file}:`, error.message);
        errorCount++;
      }
    }
    
    // Generate TypeScript file
    const tsContent = `// Auto-generated file - do not edit manually
// Generated from ${successCount} YAML flavor files

export interface FlavorScheme {
  scheme: string;
  author: string;
  slug?: string;
  base00: string;
  base01: string;
  base02: string;
  base03: string;
  base04: string;
  base05: string;
  base06: string;
  base07: string;
  base08: string;
  base09: string;
  base0A: string;
  base0B: string;
  base0C: string;
  base0D: string;
  base0E: string;
  base0F: string;
}

export const GENERATED_FLAVORS: Record<string, FlavorScheme> = ${JSON.stringify(flavors, null, 2)};

export const FLAVOR_NAMES: string[] = ${JSON.stringify(Object.keys(flavors).sort(), null, 2)};
`;
    
    fs.writeFileSync(outputFile, tsContent);
    console.log(`✅ Successfully generated ${outputFile}`);
    console.log(`📊 Processed: ${successCount} success, ${errorCount} errors`);
    console.log(`🎨 Available flavors: ${Object.keys(flavors).length}`);
    
  } catch (error) {
    console.error('❌ Failed to build flavors:', error);
    process.exit(1);
  }
}

buildFlavors();