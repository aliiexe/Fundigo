import Link from "next/link";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#F6F7FB] font-sans text-[#111827] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Privacy policy</h1>
        <p className="text-[#6B7280] text-sm mb-8">
          We take your privacy seriously. Your data is encrypted and used only to power your personal finance dashboard.
        </p>
        <Link href="/" className="text-[#2B6CB0] hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
