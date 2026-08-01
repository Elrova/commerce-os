import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "matterhorn-wholesale.com" },
      { protocol: "http", hostname: "matterhorn-wholesale.com" },
      { protocol: "https", hostname: "i.ebayimg.com" },
      { protocol: "https", hostname: "thumbs.ebaystatic.com" },
    ],
  },
};

export default nextConfig;
