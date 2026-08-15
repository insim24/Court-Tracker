import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist (used by pdf-parse) relies on a worker file it resolves at
  // runtime relative to its own package location; bundling it breaks that
  // resolution, so it needs to load natively from node_modules instead.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  // pdfjs-dist loads its worker via a runtime-computed dynamic import
  // (`import("./pdf.worker.mjs")`), which Next's static output-file tracer
  // can't follow — so the file gets silently dropped from the deployed
  // Vercel function bundle, causing "Cannot find module
  // .../pdf.worker.mjs" only in production. Force-include it explicitly.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },
};

export default nextConfig;
