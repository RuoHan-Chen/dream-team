import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    nodeMiddleware: true, // TEMPORARY: Only needed until Edge runtime support is added
  },
};

export default nextConfig;
