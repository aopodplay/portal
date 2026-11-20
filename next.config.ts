import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
        ],
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
    remotePatterns: [
      { protocol: "https", hostname: "cdn-gmmkecj.nitrocdn.com" },
      { protocol: "https", hostname: "www.starcenter.co.ao" },
      { protocol: "https", hostname: "a-static.mlcdn.com.br" },
      { protocol: "https", hostname: "4514-41-193-202-7.ngrok-free.app", port: "3001" },
      { protocol: "https", hostname: "starcenter.co.ao" },
      { protocol: "https", hostname: "starcenter.co.ao", port: "443" },
      { protocol: "https", hostname: "starcenter.co.ao", port: "80" },
      // Permite localhost em qualquer porta
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
