/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/graph",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
