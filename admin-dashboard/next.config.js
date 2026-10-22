//@ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
  },
  async rewrites() {
    const isVercel = Boolean(process.env.VERCEL);
    const remoteUrl = process.env.BACKEND_INTERNAL_URL;
    const backendUrl = remoteUrl || (!isVercel ? (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3333') : null);

    if (!backendUrl) {
      return [];
    }

    return [
      {
        source: '/backend-api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
