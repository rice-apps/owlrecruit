import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@untitled-ui/icons-react"],
  },
};

export default nextConfig;
