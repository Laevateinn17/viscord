import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true
  },
  output: "standalone",
  reactStrictMode: false,
  /* config options here */
};

export default nextConfig;
