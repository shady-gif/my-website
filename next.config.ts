import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      afterFiles: [
        {
          source: "/ppt",
          destination: "https://presenton-vercel-worker.vercel.app/ppt",
        },
        {
          source: "/ppt/:path*",
          destination: "https://presenton-vercel-worker.vercel.app/ppt/:path*",
        },
        {
          source: "/prompt-to-website",
          destination: "https://shadyy-preview.vercel.app/prompt-to-website",
        },
        {
          source: "/prompt-to-website/:path*",
          destination: "https://shadyy-preview.vercel.app/prompt-to-website/:path*",
        },
        {
          source: "/api/:path*",
          destination: "https://shadyy-preview.vercel.app/api/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
