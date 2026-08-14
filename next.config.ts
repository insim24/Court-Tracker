import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist (used by pdf-parse) relies on a worker file it resolves at
  // runtime relative to its own package location; bundling it breaks that
  // resolution, so it needs to load natively from node_modules instead.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
