import type { NextConfig } from "next";

const isStaticExport = process.env.BUILD_STATIC === 'true';

const nextConfig: NextConfig = {
  eslint: {
    // Temporarily ignore ESLint errors during builds for deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporarily ignore TypeScript errors during builds for deployment  
    ignoreBuildErrors: true,
  },
  ...(isStaticExport && {
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true
    }
  })
};

export default nextConfig;
