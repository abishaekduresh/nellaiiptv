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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/nellaiiptv/nellaiiptv/backend/public/api';
      // Derive backend root from API URL (strip /api suffix)
      const backendUrl = apiUrl.replace(/\/api$/, '');

      return [
        {
          source: '/uploads/:path*',
          destination: `${backendUrl}/uploads/:path*`,
        },
        {
          source: '/api/:path*',
          destination: `${apiUrl}/:path*`, // Forward /api calls to backend /api
        }
      ];
  },
};

export default nextConfig;
