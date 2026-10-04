/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [{ source: "/check", destination: "/", permanent: true }];
  },
};

export default nextConfig;
