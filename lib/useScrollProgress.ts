"use client";

import { useEffect, useState } from "react";

/** Returns scroll progress 0..1. Used for sticky CTA (e.g. show after 0.3). */
export function useScrollProgress(threshold = 0.3): { progress: number; pastThreshold: boolean } {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return { progress, pastThreshold: progress >= threshold };
}
