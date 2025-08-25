import Image from "@/components/image";
import ClientSyntaxPreview from "@/components/ClientSyntaxPreview";
import ImageThemePreview from "@/components/ImageThemePreview";
import { findLowestEntropyPosition } from "@/lib/entropy";
import { REFERENCE_PALETTE_DARK, type OkhslColor } from "@terminal-tones/theme-generator";
import { generateInitialThemeFromSource } from "@terminal-tones/theme-generator/preconfigured";

type UnsplashPhoto = {
  id: string;
  width?: number;
  height?: number;
  alt_description: string | null;
  urls: {
    small: string;
    regular: string;
    thumb: string;
  };
  links: {
    html: string;
  };
  user: {
    name: string;
    links: {
      html: string;
    };
  };
};

async function getUnsplashWallpapers(count: number = 12): Promise<UnsplashPhoto[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return [];
  }

  const perPage = Math.min(30, Math.max(1, count));
  const pages = Math.ceil(count / perPage);

  const requests = Array.from({ length: pages }, (_, i) => {
    const url = new URL("https://api.unsplash.com/topics/wallpapers/photos");
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("order_by", "latest");
    url.searchParams.set("page", String(i + 1));

    return fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
      next: { revalidate: 60 * 60 },
    });
  });

  const responses = await Promise.all(requests);
  const okResponses = responses.filter((r) => r.ok);
  if (okResponses.length === 0) return [];

  const pagesData = await Promise.all(okResponses.map((r) => r.json())) as UnsplashPhoto[][];
  const all = pagesData.flat().slice(0, count);
  return Array.isArray(all) ? all : [];
}

export default async function Home() {
  const photos = await getUnsplashWallpapers(48);
  // const referenceOkhsl = REFERENCE_PALETTE_DARK.map(([c]) => c);

  // Compute base16 palettes on the server during build time
  const themes: Record<string, OkhslColor[] | null> = Object.fromEntries(
    await Promise.all(
      photos.map(async (p) => {
        const url = p?.urls?.regular || p?.urls?.small;
        if (!url) return [p.id, null] as const;
        try {
          const result = await generateInitialThemeFromSource(url, { colorCount: 24 });
          const base16 = result.base16Okhsl as OkhslColor[];
          return [p.id, base16] as const;
        } catch {
          // Explicitly surface failure by returning null; client component will now throw instead of defaulting
          return [p.id, null] as const;
        }
      }),
    ),
  );

  // Compute suggested overlay positions via server-side entropy on downscaled images
  const overlayPositions: Record<string, { leftPercent: number; topPercent: number }> = Object.fromEntries(
    await Promise.all(
      photos.map(async (p) => {
        const url = p?.urls?.regular || p?.urls?.small;
        if (!url) return [p.id, { leftPercent: 27.5, topPercent: 27.5 }] as const; // ~center for 45% width
        try {
          const { leftPercent, topPercent } = await findLowestEntropyPosition(url, 45, 1, 320);
          return [p.id, { leftPercent, topPercent }] as const;
        } catch {
          // Fallback to center-like default
          return [p.id, { leftPercent: 27.5, topPercent: 27.5 }] as const;
        }
      }),
    ),
  );

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-2xl font-semibold tracking-tight">Terminal Tones</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Upload an image on the Create page, or explore palettes below.</p>

        {photos.length > 0 && (
          <section className="w-full">
            <h2 className="mb-3 text-xl font-semibold tracking-tight">Wallpapers from Unsplash</h2>
            <div className="columns-2 gap-6 [column-fill:_balance]">
              {photos.map((photo) => {
                const photoAlt = photo.alt_description ?? `Photo by ${photo.user.name}`;
                const photoLink = `${photo.links.html}?utm_source=terminal-tones&utm_medium=referral`;
                const userLink = `${photo.user.links.html}?utm_source=terminal-tones&utm_medium=referral`;
                return (
                  <div
                    key={photo.id}
                    className="relative inline-block w-full mb-6 [break-inside:avoid]"
                  >
                    <a
                      href={photoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Image
                        src={photo.urls.regular || photo.urls.small}
                        alt={photoAlt}
                        width={1200}
                        height={800}
                        className="w-full h-auto object-contain"
                      />
                    </a>

                    {/* Entropy‑based overlay preview positioning */}
                    <div className="pointer-events-none absolute inset-0 p-0">
                      <div
                        className="absolute overflow-hidden rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.4)] z-20"
                        style={{
                          // Use percentage-based placement for responsiveness
                          left: `${overlayPositions[photo.id]?.leftPercent ?? 27.5}%`,
                          top: `${overlayPositions[photo.id]?.topPercent ?? 27.5}%`,
                          width: `45%`,
                          aspectRatio: '1 / 1',
                        }}
                      >
                        <div className="w-full h-full">
                        {themes[photo.id] ? (
                          <ClientSyntaxPreview
                            okhslBase16={themes[photo.id]}
                            language="typescript"
                            idSeed={photo.id}
                            fontSizePx={10}
                            backgroundOpacity={0.85}
                          />
                        ) : (
                          <ImageThemePreview
                            imageUrl={photo.urls.regular || photo.urls.small}
                            language="typescript"
                            idSeed={photo.id}
                            fontSizePx={10}
                            backgroundOpacity={0.85}
                          />
                        )}
                        </div>
                      </div>
                    </div>

                    <div className="py-2 text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                      <span>Photo by</span>
                      <a href={userLink} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                        {photo.user.name}
                      </a>
                      <span>on</span>
                      <a href={photoLink} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                        Unsplash
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
      <footer className="row-start-3 text-xs text-gray-500">© Terminal Tones</footer>
    </div>
  );
}
