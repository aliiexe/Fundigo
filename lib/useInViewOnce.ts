"use client";

import { useEffect, useRef, useState } from "react";

/** Returns true once the element has been in view (for animated counters). */
export function useInViewOnce(options?: IntersectionObserverInit): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [hasBeenInView, setHasBeenInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setHasBeenInView(true);
      },
      { threshold: 0.2, rootMargin: "0px 0px -50px 0px", ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.threshold, options?.rootMargin]);

  return [ref, hasBeenInView];
}
