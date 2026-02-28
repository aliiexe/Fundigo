"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/v1/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.onboarding_completed_at && data?.country_code) setAllowed(true);
        else router.replace("/onboarding");
      })
      .catch(() => router.replace("/onboarding"));
  }, [router]);

  if (allowed === null) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-fade-in text-center">
          <div className="w-6 h-6 border-2 border-[#FF4000] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#737373] text-xs">Loading...</p>
        </div>
      </div>
    );
  }

  if (!allowed) return null;
  return <>{children}</>;
}
