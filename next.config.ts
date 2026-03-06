import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/graderPage",
        destination: "/grader",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
