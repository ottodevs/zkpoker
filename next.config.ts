import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer, dev }) => {
    // Add support for Web Workers
    config.module.rules.push({
      test: /\.worker\.ts$/,
      use: { loader: 'worker-loader' },
    });

    // Fix issues with Web Workers in Next.js
    if (!isServer) {
      config.output.globalObject = 'self';
    }

    return config;
  },
};

export default nextConfig;
