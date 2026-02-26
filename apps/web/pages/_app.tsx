// File: apps/web/pages/_app.tsx
import type { AppProps } from 'next/app';
import { ClerkProvider } from '@clerk/nextjs';
import '@/styles/globals.css';

// Sentry init when SENTRY_DSN is set (injected by @sentry/nextjs)
// TODO: Ensure sentry.client.config.js exists if using Sentry
export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
