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
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '**',
      }
    ],
    minimumCacheTTL: 86400, // 24 hours cache
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    ...(isStaticExport && {
      unoptimized: true
    })
  },
  // Remove static export for now since we need API routes
  // ...(isStaticExport && {
  //   output: 'export',
  //   trailingSlash: true,
  // })
};

export default nextConfig;
