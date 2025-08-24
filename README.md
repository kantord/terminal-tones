# Terminal Tones

Generate beautiful, real 16‑color terminal themes from images. Upload a photo, extract colors with ColorThief, map them to a base16‑style palette via OKHSL and palette matching, then preview syntax highlighting and export configs.

### Packages
- **packages/web**: Next.js app (App Router, static export) with image upload UI, Unsplash home gallery, syntax preview, and fine‑tuning (black/white points, midpoint).
- **packages/theme-generator**: Core algorithms: image color extraction, OKHSL conversions, palette matching, lightness tuning, kitty config.
- **packages/cli**: Node CLI to generate a base16 palette from a local file or URL.

### Quick start
- Prereqs: Node 20+, pnpm 10+
- Install deps:
```bash
pnpm install
```
- Dev server:
```bash
pnpm dev
```
- Build everything:
```bash
pnpm build
```
- Start the built web app:
```bash
pnpm start
```

### Web (Next.js)
- Dev:
```bash
pnpm --filter web dev
```
- Build (static export enabled):
```bash
pnpm --filter web build
```
- E2E tests:
```bash
pnpm --filter web e2e:run
```
- Env: optional `UNSPLASH_ACCESS_KEY` enables the home page gallery.

Notes:
- Static export is enabled; API routes aren’t relied on by the home page fallback.
- Client‑side extraction uses cross‑origin images with `crossOrigin='anonymous'`. Images without CORS may fail; uploads (blobs) always work.

### Theme generator (library)
Key APIs from `@terminal-tones/theme-generator`:
- `extractColorsFromImage(source, count)` → OKHSL candidates from a URL, File, or HTMLImageElement (browser) or from URL/path/Buffer (server side via `preconfigured`).
- `getBestColorScheme(colors, reference)` → Selects and orders the best 16 colors to match a reference palette.
- `customizeColorScheme(base16, reference, { blackPointLightness, whitePointLightness, midpoint })` → Adjusts lightness across the 16‑color palette.
- `okhslToHex(color)` → Hex output.
- `generateKittyConfig(base16)` → kitty terminal config.

Strictness:
- Extraction must yield at least 16 candidates. We explicitly fail rather than silently falling back to a default palette.

### CLI
Generate a base16 palette in hex from an image:
```bash
pnpm --filter cli build
pnpm --filter cli start -- generate ./path/to/image.jpg
# or
pnpm --filter cli start -- generate https://example.com/photo.jpg
```
Options:
- `-n, --count <number>`: number of colors to extract before selecting best 16 (default 24).

### Scripts (root)
- `pnpm dev`: run the web app in dev mode
- `pnpm build`: build library, web, and CLI
- `pnpm start`: start web after build
- `pnpm test`: run unit tests (vitest)
- `pnpm e2e:run`: run E2E tests for web
- `pnpm format`: Prettier format

### Tech
- Next.js 15 (App Router, Turbopack), React 19
- ColorThief for palette extraction
- Culori for OKHSL/OKLAB conversions
- Radix UI + Tailwind (v4) for UI
- Playwright for E2E, Vitest for unit tests

### Development notes
- When running tests with Vitest in this monorepo, prefer non‑interactive mode:
```bash
pnpm run test --run
```
- The home page extracts palettes on the server when possible; otherwise it falls back to client‑side extraction without defaults.

### License
MIT
