import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/graderPage",
        destination: "/grader",
        permanent: true,
      },
      {
        source: "/dashboard/gh",
        destination: "/admin/gestion",
        permanent: true,
      },
      {
        source: "/dashboard/config",
        destination: "/admin/configuracion",
        permanent: true,
      },
      {
        source: "/dashboard/rotations",
        destination: "/admin/rotaciones",
        permanent: true,
      },
      {
        source: "/dashboard/bases",
        destination: "/admin/bases",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
