import Head from 'next/head';
import Link from 'next/link';

export default function Privacy() {
  return (
    <>
      <Head><title>Privacy policy — Fundigo</title></Head>
      <div className="min-h-screen bg-background font-sans text-text py-12 px-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Privacy policy</h1>
        <p className="text-text-muted text-sm mb-8">We take your privacy seriously. Data is encrypted and used only to power your personal finance dashboard. See docs/SECURITY_CHECKLIST.md for technical details.</p>
        <Link href="/" className="text-primary hover:underline">Back to home</Link>
      </div>
    </>
  );
}
