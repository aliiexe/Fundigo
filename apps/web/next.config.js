/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // SECURITY: Ensure CSP, HSTS etc. are configured in production (see docs/SECURITY_CHECKLIST.md)
};

// Wrap with Sentry when SENTRY_DSN is set (optional)
if (process.env.SENTRY_DSN) {
  const { withSentryConfig } = require('@sentry/nextjs');
  module.exports = withSentryConfig(nextConfig, {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  });
} else {
  module.exports = nextConfig;
}
