import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Monorepo / parent-folder lockfiles: keep tracing inside this app
  outputFileTracingRoot: path.join(process.cwd()),
  serverExternalPackages: [
    "@tensorflow/tfjs",
    "@tensorflow/tfjs-backend-webgl",
    "@tensorflow-models/pose-detection",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
