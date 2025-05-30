/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mindrank/shared'],
  experimental: {
    serverActions: true,
  },
  async redirects() {
    return [
      {
        source: '/login/google',
        destination: '/auth/callback',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig; 