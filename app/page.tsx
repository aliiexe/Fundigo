"use client";

import {
  LandingLayout,
  Header,
  Hero,
  FeatureGrid,
  HowItWorks,
  Stats,
  CTA,
  StickyMicroCTA,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <LandingLayout>
      {/* Full-page orange glow: sits behind header + hero so nothing cuts the fade */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
        <div
          className="absolute -top-[40%] -left-[15%] h-[90vmax] w-[90vmax] max-h-[1200px] max-w-[1200px] rounded-full bg-accent/12 blur-[120px]"
          style={{ transform: "translateZ(0)" }}
        />
        <div
          className="absolute top-[20%] -right-[20%] h-[60vmax] w-[60vmax] max-h-[800px] rounded-full bg-accent/[0.08] blur-[100px]"
          style={{ transform: "translateZ(0)" }}
        />
      </div>
      <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none" aria-hidden />
      <Header />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <FeatureGrid />
        <HowItWorks />
        <Stats />
        <CTA />
      </main>
      <Footer />
      <StickyMicroCTA />
    </LandingLayout>
  );
}
