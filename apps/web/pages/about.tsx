import Head from 'next/head';
import Link from 'next/link';

export default function About() {
  return (
    <>
      <Head><title>About — Fundigo</title></Head>
      <div className="min-h-screen bg-background font-sans text-text py-12 px-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">About Fundigo</h1>
        <p className="text-text-muted text-sm mb-8">Fundigo is a privacy-first personal finance companion. Track incomes, subscriptions, and expenses; get smart allocation suggestions; and reach your goals with a clean, MacBook-inspired experience.</p>
        <Link href="/" className="text-primary hover:underline">Back to home</Link>
      </div>
    </>
  );
}
