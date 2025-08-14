import type { NextConfig } from "next";
import { config as dotenvConfig } from "dotenv";
import path from "path";

// Load a single env file from the monorepo root
dotenvConfig({ path: path.resolve(__dirname, "..", "..", ".env") });

export const BASE_PATH =
  process.env.NODE_ENV === "development" ? "" : "/terminal-tones";

const nextConfig: NextConfig = {
  output: "export",
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
  transpilePackages: ["@terminal-tones/theme-generator"]
};

export default nextConfig;
