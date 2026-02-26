import Link from "next/link";

export default function About() {
  return (
    <div className="min-h-screen bg-[#F6F7FB] font-sans text-[#111827] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">About Fundigo</h1>
        <p className="text-[#6B7280] text-sm mb-8">
          Fundigo is a privacy-first personal finance companion. Track incomes, subscriptions, and expenses; get smart allocation suggestions; and reach your goals.
        </p>
        <Link href="/" className="text-[#2B6CB0] hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
