/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aihype-academy.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
