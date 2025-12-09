/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@campusmind/shared'],
  images: {
    domains: [],
  },
  // Use standalone output for better deployment compatibility
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/app/timer',
        destination: '/app/pomodoro',
        permanent: true,
      },
      {
        source: '/app/groups',
        destination: '/app/social',
        permanent: true,
      },
      {
        source: '/app/dashboard',
        destination: '/app',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
