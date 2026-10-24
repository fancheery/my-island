import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 关闭 Next 16 的 Cache Components / 部分预取：
  // 本项目每个页面都依赖每次访问时的日期、登录态与本地数据，
  // 静态缓存化会导致组件不水合（无交互、无自动保存）。
  cacheComponents: false,
  partialPrefetching: false,
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
