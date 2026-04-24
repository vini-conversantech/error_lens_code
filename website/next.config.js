/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Ensure we can build it even in a subdirectory
  output: 'standalone',
};

module.exports = nextConfig;
