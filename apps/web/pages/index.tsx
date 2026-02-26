// File: apps/web/pages/index.tsx — Hero landing page
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { SignInButton, SignUpButton } from '@clerk/nextjs';

function TryDemoButton() {
  const router = useRouter();
  const handleDemo = () => {
    document.cookie = 'demo_mode=true; path=/; max-age=86400';
    router.push('/dashboard');
  };
  return (
    <button
      type="button"
      onClick={handleDemo}
      className="px-6 py-3 rounded-input font-medium border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label="Try demo without signing in"
    >
      Try demo
    </button>
  );
}

export default function Landing() {
  return (
    <>
      <Head>
        <title>Fundigo — Your Personal Finance Companion</title>
        <meta name="description" content="Track, plan, and optimize your spending effortlessly. Privacy-first personal finance with smart allocation and Moroccan subscription insights." />
      </Head>
      <div className="min-h-screen bg-background font-sans text-text flex flex-col">
        {/* Hero — full-width, gradient + shapes */}
        <header className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" aria-hidden />
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
          <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-primary/5 blur-3xl" aria-hidden />
          <nav className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
            <span className="text-xl font-semibold text-text">Fundigo</span>
            <div className="flex items-center gap-3">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="px-4 py-2 rounded-input font-medium text-text hover:text-primary transition-colors"
                  aria-label="Sign in"
                >
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="px-5 py-2.5 bg-primary text-white rounded-input font-medium hover:bg-primary-hover shadow-card hover:shadow-card-hover transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Sign up"
                >
                  Sign up
                </button>
              </SignUpButton>
            </div>
          </nav>

          <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-24 sm:pt-24 sm:pb-32 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-text mb-6">
              Fundigo — Your Personal Finance Companion
            </h1>
            <p className="text-lg sm:text-xl text-text-muted max-w-2xl mx-auto mb-10">
              Track, plan, and optimize your spending effortlessly.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="px-8 py-4 bg-primary text-white rounded-input font-semibold text-lg shadow-card hover:shadow-card-hover hover:bg-primary-hover transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transform hover:-translate-y-0.5"
                  aria-label="Get started — Sign up"
                >
                  Get started
                </button>
              </SignUpButton>
              <TryDemoButton />
            </div>
            <p className="mt-6 text-sm text-text-muted">
              No credit card required. Try the demo to see your dashboard with sample data.
            </p>
            {/* Optional: subtle SVG illustration */}
            <div className="mt-16 flex justify-center" aria-hidden>
              <svg className="w-64 h-48 text-primary/20" viewBox="0 0 256 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="24" y="48" width="80" height="64" rx="8" stroke="currentColor" strokeWidth="2" fill="white" />
                <rect x="152" y="48" width="80" height="64" rx="8" stroke="currentColor" strokeWidth="2" fill="white" />
                <path d="M104 80h48M104 96h32M104 112h40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="40" cy="72" r="8" fill="currentColor" />
                <circle cx="168" cy="72" r="8" fill="currentColor" />
              </svg>
            </div>
          </section>
        </header>

        {/* Value props — clean cards */}
        <section className="relative py-20 px-4 sm:px-6 max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-text text-center mb-12">Why Fundigo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface rounded-card shadow-card p-6 hover:shadow-card-hover transition-shadow duration-300">
              <h3 className="font-semibold text-text mb-2">Smart allocation</h3>
              <p className="text-text-muted text-sm">Spend, save, and invest with suggested splits that adapt to your goals.</p>
            </div>
            <div className="bg-surface rounded-card shadow-card p-6 hover:shadow-card-hover transition-shadow duration-300">
              <h3 className="font-semibold text-text mb-2">Subscription insights</h3>
              <p className="text-text-muted text-sm">Moroccan-friendly catalog. Track Netflix, Spotify, Cursor, and more in MAD.</p>
            </div>
            <div className="bg-surface rounded-card shadow-card p-6 hover:shadow-card-hover transition-shadow duration-300">
              <h3 className="font-semibold text-text mb-2">Privacy first</h3>
              <p className="text-text-muted text-sm">Server-side encryption and optional E2E. Your data stays yours.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto border-t border-gray-200 py-8 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-text-muted text-sm">© Fundigo. All rights reserved.</span>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="text-text-muted hover:text-primary transition-colors">Privacy policy</Link>
              <Link href="/about" className="text-text-muted hover:text-primary transition-colors">About</Link>
              <Link href="/contact" className="text-text-muted hover:text-primary transition-colors">Contact</Link>
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}
