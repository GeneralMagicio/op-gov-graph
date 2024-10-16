// Import and validate the environment variables
await import("./src/env.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/graph",
        destination: "/",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
