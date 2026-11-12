import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
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
