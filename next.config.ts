import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/data/:file*.gz",
        headers: [
          { key: "Content-Type", value: "application/octet-stream" },
        ],
      },
    ];
  },
};

export default nextConfig;
