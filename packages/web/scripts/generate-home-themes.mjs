import { config as dotenvConfig } from 'dotenv';
import path from 'node:path';
import fs from 'node:fs/promises';

// Load monorepo root .env
dotenvConfig({ path: path.resolve(process.cwd(), '../../.env') });

const { extractBase16FromRemoteImage } = await import('@terminal-tones/theme-generator/extractColorsServer');

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!ACCESS_KEY) {
  console.warn('UNSPLASH_ACCESS_KEY not set; generating empty home-themes.json');
  await fs.mkdir(path.resolve(process.cwd(), 'src/data'), { recursive: true });
  await fs.writeFile(path.resolve(process.cwd(), 'src/data/home-themes.json'), JSON.stringify({}, null, 2));
  process.exit(0);
}

async function getUnsplashWallpapers(count = 12) {
  const url = new URL('https://api.unsplash.com/topics/wallpapers/photos');
  url.searchParams.set('per_page', String(count));
  url.searchParams.set('order_by', 'latest');

  const resp = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${ACCESS_KEY}`,
      'Accept-Version': 'v1',
    },
  });
  if (!resp.ok) return [];
  const data = await resp.json();
  return Array.isArray(data) ? data : [];
}

const photos = await getUnsplashWallpapers(12);
const mapping = {};

await Promise.all(
  photos.map(async (p) => {
    const url = p?.urls?.regular || p?.urls?.small;
    if (!url) return;
    try {
      const base16 = await extractBase16FromRemoteImage(url, 24);
      if (Array.isArray(base16) && base16.length === 16) {
        mapping[p.id] = base16;
      }
    } catch (e) {
      // skip on failure
    }
  }),
);

await fs.mkdir(path.resolve(process.cwd(), 'src/data'), { recursive: true });
await fs.writeFile(
  path.resolve(process.cwd(), 'src/data/home-themes.json'),
  JSON.stringify(mapping, null, 2),
);
console.log(`Generated home-themes.json with ${Object.keys(mapping).length} entries`);
