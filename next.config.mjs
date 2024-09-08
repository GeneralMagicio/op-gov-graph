/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/graph",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
