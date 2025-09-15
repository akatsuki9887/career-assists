import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  reactStrictMode: true,
  images: {
    domains: ['avatars.githubusercontent.com', 'example.com'], 
    formats: ['image/avif', 'image/webp'], 
  },
  async rewrites() {
    return [
      { source: '/api/auth/:path*', destination: '/api/auth/:path*' },
      { source: '/api/:path*', destination: 'http://127.0.0.1:8000/api/:path*' },
    ];
  },
};
export default nextConfig;
module.exports = nextConfig;