import path from 'node:path';
import fs from 'node:fs/promises';

// Simplified: write an empty mapping. Client-side colorthief will handle extraction at runtime.
await fs.mkdir(path.resolve(process.cwd(), 'src/data'), { recursive: true });
await fs.writeFile(path.resolve(process.cwd(), 'src/data/home-themes.json'), JSON.stringify({}, null, 2));
console.log('Wrote empty home-themes.json (server-side extraction disabled)');
