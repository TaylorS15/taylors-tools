import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },
  headers: async () => [
    {
      source: "/tool/audio-to-transcript\\?checkout_state=INPUT",
      headers: [
        {
          key: "Cross-Origin-Opener-Policy",
          value: "same-origin",
        },
        {
          key: "Cross-Origin-Embedder-Policy",
          value: "require-corp",
        },
      ],
    },
  ],
};

export default nextConfig;
