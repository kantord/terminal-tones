import type { NextConfig } from "next";


export const BASE_PATH =
  process.env.NODE_ENV === "development" ? "" : "/terminal-tones"

const nextConfig: NextConfig = {
  output: 'export',
  basePath: BASE_PATH,
  /**
   * Disable server-based image optimization. Next.js does not support
   * dynamic features with static exports.
   *
   * @see https://nextjs.org/docs/app/api-reference/components/image#unoptimized
   */
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
