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
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
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
