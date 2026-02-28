"use client";

import { useEffect, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  enabled: boolean;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 1200,
  enabled,
  decimals = 0,
  className = "",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setCount(value);
      return;
    }
    let start: number;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const next = progress * value;
      setCount(decimals ? Math.round(next * 10 ** decimals) / 10 ** decimals : Math.floor(next));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration, enabled, decimals]);

  const display = decimals ? count.toFixed(decimals) : String(count);
  return (
    <span className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
