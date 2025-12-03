import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // react-pdfのCanvasやWorkerを正しく処理するための設定
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  // 画像最適化の設定
  images: {
    domains: [],
  },
  // 実験的機能の有効化
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
