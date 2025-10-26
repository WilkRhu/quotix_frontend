/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://quotix-backend.fly.dev/:path*',
      },
    ];
  },
};

module.exports = nextConfig;