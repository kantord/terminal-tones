import Image from "@/components/image";
import ClientSyntaxPreview from "@/components/ClientSyntaxPreview";
import ImageThemePreview from "@/components/ImageThemePreview";
import { REFERENCE_PALETTE_DARK, type OkhslColor } from "@terminal-tones/theme-generator";
import precomputed from "@/data/home-themes.json" assert { type: "json" };

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
  const referenceOkhsl = REFERENCE_PALETTE_DARK.map(([c]) => c);

  // Use precomputed palettes if available; else mark as null to compute client-side per image
  const themes: Record<string, OkhslColor[] | null> = Object.fromEntries(
    photos.map((p) => [p.id, (precomputed as Record<string, OkhslColor[] | undefined>)[p.id] ?? null]),
  );

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
              src/app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            Save and see your changes instantly.
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>

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
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
