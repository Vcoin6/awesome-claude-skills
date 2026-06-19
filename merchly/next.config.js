/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Media is served from /public/uploads at runtime.
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

module.exports = nextConfig;
