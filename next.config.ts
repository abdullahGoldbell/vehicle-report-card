import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['mssql', 'puppeteer', 'handlebars'],
  distDir: '.next',
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
