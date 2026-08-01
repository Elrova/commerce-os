import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "matterhorn-wholesale.com" },
      { protocol: "http", hostname: "matterhorn-wholesale.com" },
    ],
  },
};

export default nextConfig;
