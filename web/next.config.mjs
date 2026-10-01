/** @type {import('next').NextConfig} */
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

// Only run in development to set up local bindings (Cloudflare Pages D1, KV, etc.)
if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

const nextConfig = {};

export default nextConfig;
