/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Avoid ESLint "useEslintrc/extensions" error with flat config during Vercel build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
