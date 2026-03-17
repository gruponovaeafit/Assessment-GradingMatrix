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
        destination: "/admin/management",
        permanent: true,
      },
      {
        source: "/dashboard/config",
        destination: "/admin/configuration",
        permanent: true,
      },
      {
        source: "/dashboard/rotations",
        destination: "/admin/rotations",
        permanent: true,
      },
      {
        source: "/dashboard/bases",
        destination: "/admin/bases",
        permanent: true,
      },
      {
        source: "/admin/configuracion",
        destination: "/admin/configuration",
        permanent: true,
      },
      {
        source: "/admin/gestion",
        destination: "/admin/management",
        permanent: true,
      },
      {
        source: "/admin/rotaciones",
        destination: "/admin/rotations",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
