/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
      return [
        {
          source: '/uploads/:path*',
          destination: 'http://localhost/nellaiiptv/nellaiiptv/backend/public/uploads/:path*',
        },
        {
          source: '/api/:path*',
          destination: 'http://localhost/nellaiiptv/nellaiiptv/backend/public/api/:path*',
        }
      ];
  },
};

export default nextConfig;
