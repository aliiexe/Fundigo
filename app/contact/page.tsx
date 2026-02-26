import Link from "next/link";

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#F6F7FB] font-sans text-[#111827] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Contact</h1>
        <p className="text-[#6B7280] text-sm mb-8">
          Reach out for support or feedback. Include your email and we&apos;ll get back to you.
        </p>
        <Link href="/" className="text-[#2B6CB0] hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
