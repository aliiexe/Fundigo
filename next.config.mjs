/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Avoid ESLint "useEslintrc/extensions" error with flat config during Vercel build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Tesseract.js uses a Node worker; Next must not bundle it so the worker path resolves
  serverExternalPackages: ["tesseract.js"],
};

export default nextConfig;
