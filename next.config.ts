import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/api/media/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/api/media/**' },
      { protocol: 'http', hostname: 'kong', port: '8000', pathname: '/api/media/**' },
    ],
  },
};

export default nextConfig;
