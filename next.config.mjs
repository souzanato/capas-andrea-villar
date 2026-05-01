/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "img-src 'self' data: blob: https://lh3.googleusercontent.com https://lh4.googleusercontent.com https://lh5.googleusercontent.com https://lh6.googleusercontent.com;",
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.externals = [
      ...(config.externals || []),
      { canvas: "canvas" },
    ];
    return config;
  },
};

export default nextConfig;
