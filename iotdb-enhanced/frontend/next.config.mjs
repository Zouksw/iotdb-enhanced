/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@refinedev/antd"],
  // Allow external access
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
