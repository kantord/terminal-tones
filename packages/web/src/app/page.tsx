import Image from "@/components/image";
import ClientSyntaxPreview from "@/components/ClientSyntaxPreview";
import ImageThemePreview from "@/components/ImageThemePreview";
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

  const url = new URL("https://api.unsplash.com/topics/wallpapers/photos");
  url.searchParams.set("per_page", String(count));
  url.searchParams.set("order_by", "latest");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      "Accept-Version": "v1",
    },
    // Cache on the server to avoid rate limits; for static export this
    // is evaluated at build time.
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as UnsplashPhoto[];
  return Array.isArray(data) ? data : [];
}

export default async function Home() {
  const photos = await getUnsplashWallpapers(12);
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

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-2xl font-semibold tracking-tight">Terminal Tones</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Upload an image on the Create page, or explore palettes below.</p>

        {photos.length > 0 && (
          <section className="w-full">
            <h2 className="mb-3 text-xl font-semibold tracking-tight">Wallpapers from Unsplash</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {photos.map((photo) => {
                const photoAlt = photo.alt_description ?? `Photo by ${photo.user.name}`;
                const photoLink = `${photo.links.html}?utm_source=terminal-tones&utm_medium=referral`;
                const userLink = `${photo.user.links.html}?utm_source=terminal-tones&utm_medium=referral`;
                return (
                  <div
                    key={photo.id}
                    className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-sm"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      <a
                        href={photoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                      >
                        <Image
                          src={photo.urls.regular || photo.urls.small}
                          alt={photoAlt}
                          width={1200}
                          height={800}
                          className="w-full h-full object-cover max-h-72 lg:max-h-full transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      </a>

                      <div className="p-4">
                        {themes[photo.id] ? (
                          <ClientSyntaxPreview
                            okhslBase16={themes[photo.id]}
                            language="typescript"
                            idSeed={photo.id}
                          />
                        ) : (
                          <ImageThemePreview
                            imageUrl={photo.urls.regular || photo.urls.small}
                            language="typescript"
                            idSeed={photo.id}
                          />
                        )}
                      </div>
                    </div>

                    <div className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1 border-t border-black/5 dark:border-white/5">
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
