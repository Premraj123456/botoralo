/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/_next/:path*',
        destination:
          'http://3000-firebase-studio-1756971242442.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev/_next/:path*',
      },
    ];
  },
};

export default nextConfig;
