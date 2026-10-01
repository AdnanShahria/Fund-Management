/** @type {import('next').NextConfig} */

// Only set up local Cloudflare bindings during development
// In production this block is skipped entirely so the build does not fail
if (process.env.NODE_ENV === "development") {
  const { setupDevPlatform } = await import(
    "@cloudflare/next-on-pages/next-dev"
  );
  await setupDevPlatform();
}

const nextConfig = {};

export default nextConfig;
