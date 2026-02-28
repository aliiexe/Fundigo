"use client";

import {
  getSubscriptionLogoUrl,
  getSubscriptionColor,
  getSubscriptionInitial,
} from "@/lib/subscriptionLogos";

type Props = {
  serviceName: string;
  size?: "sm" | "md";
  variant?: "default" | "subtle";
  className?: string;
};

const sizeClasses = { sm: "w-6 h-6 text-[10px]", md: "w-9 h-9 text-xs" };

export function SubscriptionLogo({ serviceName, size = "md", variant = "default", className = "" }: Props) {
  const logoUrl = getSubscriptionLogoUrl(serviceName);
  const color = getSubscriptionColor(serviceName);
  const initial = getSubscriptionInitial(serviceName);
  const s = sizeClasses[size];
  const isSubtle = variant === "subtle";

  return (
    <div
      className={`${s} rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden ${className}`}
      style={{
        backgroundColor: isSubtle ? "#1a1a1a" : `${color}20`,
        border: isSubtle ? "1px solid #2a2a2a" : `1px solid ${color}40`,
      }}
      title={serviceName}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="w-full h-full object-contain p-0.5"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = "flex";
          }}
        />
      ) : null}
      <span
        className="font-semibold w-full h-full flex items-center justify-center"
        style={{
          color,
          display: logoUrl ? "none" : "flex",
        }}
      >
        {initial}
      </span>
    </div>
  );
}
