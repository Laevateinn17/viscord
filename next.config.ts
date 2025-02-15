import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true
  }
  /* config options here */
};

module.exports = {
  output: "standalone",
};

export default nextConfig;
