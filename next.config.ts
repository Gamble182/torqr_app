import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Enable Turbopack (Next.js 16 default)
  turbopack: {},

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vvsmxzebaoslofigxakt.supabase.co",
        pathname: "/**",
      },
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "torqr",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});
