import type { NextConfig } from "next";

// Reserved top-level paths that must NOT be rewritten to /sites/:slug
const RESERVED = "master|api|auth|sites|_next|favicon.ico"

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Clean tenant URLs: fastsigns-demos.vercel.app/:slug  →  /sites/:slug
      // so each prospect gets a shareable URL without the /sites/ prefix.
      {
        source: `/:slug((?!${RESERVED})[^/]+)/:path*`,
        destination: "/sites/:slug/:path*",
      },
      {
        source: `/:slug((?!${RESERVED})[^/]+)`,
        destination: "/sites/:slug",
      },
    ]
  },
};

export default nextConfig;
