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
  async rewrites() {
    const gatewayOrigin = (
      process.env.INTERNAL_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'http://localhost:8000'
    ).replace(/\/$/, '');
    return [
      {
        source: '/api/media/:path*',
        destination: `${gatewayOrigin}/api/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
