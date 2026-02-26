import Head from 'next/head';
import Link from 'next/link';

export default function Contact() {
  return (
    <>
      <Head><title>Contact — Fundigo</title></Head>
      <div className="min-h-screen bg-background font-sans text-text py-12 px-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Contact</h1>
        <p className="text-text-muted text-sm mb-8">Reach out for support or feedback. Include your email and we&apos;ll get back to you.</p>
        <Link href="/" className="text-primary hover:underline">Back to home</Link>
      </div>
    </>
  );
}
