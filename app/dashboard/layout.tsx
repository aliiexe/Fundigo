"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useState } from "react";
import { OnboardingGuard } from "./OnboardingGuard";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
  )},
  { href: "/dashboard/income", label: "Income", icon: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
  )},
  { href: "/dashboard/expenses", label: "Expenses", icon: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a5 5 0 00-10 0v2M5 12h14l1 9H4l1-9z" /></svg>
  )},
  { href: "/dashboard/subscriptions", label: "Subscriptions", icon: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
  )},
  { href: "/dashboard/goals", label: "Goals", icon: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  )},
  { href: "/dashboard/allocations", label: "Allocations", icon: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
  )},
  { href: "/dashboard/settings", label: "Settings", icon: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  )},
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const navContent = (
    <>
      <div className="px-4 py-5 border-b border-[#1e1e1e]">
        <Link href="/dashboard" className="text-base font-semibold text-white tracking-tight flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <span className="w-7 h-7 rounded-lg bg-[#FF4000] flex items-center justify-center text-white text-xs font-bold">F</span>
          Fundigo
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
              isActive(item.href)
                ? "bg-[#FF4000]/8 text-[#FF4000]"
                : "text-[#737373] hover:text-[#e8e8e8] hover:bg-[#191919]"
            }`}
          >
            <span className={isActive(item.href) ? "text-[#FF4000]" : "text-[#525252]"}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-[#1e1e1e]">
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/" showName={false} />
          <span className="text-xs text-[#525252]">Account</span>
        </div>
      </div>
    </>
  );

  return (
    <OnboardingGuard>
      <div className="min-h-screen bg-[#050505] text-[#e8e8e8]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-56 bg-[#0a0a0a] border-r border-[#1e1e1e] z-40">
          {navContent}
        </aside>

        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-50 glass">
          <div className="flex items-center justify-between px-4 h-14">
            <Link href="/dashboard" className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#FF4000] flex items-center justify-center text-white text-[10px] font-bold">F</span>
              Fundigo
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="w-8 h-8 rounded-md flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#191919] transition-colors"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </header>

        {/* Mobile menu overlay */}
        {mobileOpen && (
          <>
            <div className="lg:hidden fixed inset-0 z-40 bg-black/60 animate-overlay-in" onClick={() => setMobileOpen(false)} />
            <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a0a] border-r border-[#1e1e1e] flex flex-col animate-slide-up">
              {navContent}
            </aside>
          </>
        )}

        {/* Main content */}
        <main className="lg:pl-56">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </OnboardingGuard>
  );
}
