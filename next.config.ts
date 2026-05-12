import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Serve the Reddy Ice portal at the root so fastsigns-demos.vercel.app
      // works as a clean single-tenant URL for prospect sharing.
      { source: "/",               destination: "/sites/reddy-ice" },
      { source: "/login",          destination: "/sites/reddy-ice/login" },
      { source: "/products",       destination: "/sites/reddy-ice/products" },
      { source: "/products/:slug", destination: "/sites/reddy-ice/products/:slug" },
    ]
  },
};

export default nextConfig;
