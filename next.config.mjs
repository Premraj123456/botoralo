/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
  },
  env: {
    BOT_BACKEND_URL: "https://api.botoralo.space",
  },
  webpack: (config, { isServer }) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    if (isServer) {
        config.externals.push(
            '@opentelemetry/instrumentation',
            'require-in-the-middle'
        );
    }

    return config;
  },
};

export default nextConfig;
