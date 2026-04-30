/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Konva tenta importar o módulo "canvas" no servidor (que não existe)
    // Marcamos como external pra resolver
    config.externals = [
      ...(config.externals || []),
      { canvas: "canvas" },
    ];
    return config;
  },
};

export default nextConfig;
