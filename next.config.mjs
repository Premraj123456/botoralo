/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Genkit dependencies use dynamic requires for things like OpenTelemetry
    // instrumentations, which Webpack flags as a critical dependency.
    // We can safely ignore these warnings as they are not critical for the
    // application to function.
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // Mark problematic modules as external to prevent Webpack from trying
    // to bundle them, which causes the dynamic require warnings.
    // These are related to OpenTelemetry and tracing, which are not essential
    // for the core functionality in a Vercel deployment.
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
