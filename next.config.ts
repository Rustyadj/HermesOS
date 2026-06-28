import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" is used for Docker builds; omit for Vercel (it handles bundling itself)
  ...(process.env.DOCKER_BUILD ? { output: "standalone" } : {}),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
