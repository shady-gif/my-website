import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      afterFiles: [
        {
          source: "/website-preview",
          destination: "https://template-preview-gamma.vercel.app/website-preview",
        },
        {
          source: "/website-preview/:path*",
          destination:
            "https://template-preview-gamma.vercel.app/website-preview/:path*",
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
          source: "/api/:path((?!mini-store|editor).*)",
          destination: "https://shadyy-preview.vercel.app/api/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
