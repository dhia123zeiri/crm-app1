import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // tu peux mettre "20mb", "50mb" selon ton besoin
    },
  },
};

export default nextConfig;
