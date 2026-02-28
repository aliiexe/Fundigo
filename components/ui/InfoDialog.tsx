"use client";

import { useEffect, useRef } from "react";

export type InfoDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonLabel?: string;
};

export function InfoDialog({
  open,
  onClose,
  title,
  message,
  buttonLabel = "OK",
}: InfoDialogProps) {
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && okRef.current) {
      setTimeout(() => okRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center p-6">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md animate-overlay-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-dialog-title"
        aria-describedby="info-dialog-desc"
        className="relative z-10 mx-auto w-full max-w-md rounded-xl border shadow-2xl animate-slide-up overflow-hidden"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
        }}
      >
        <div className="px-6 py-4 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
          <h2 id="info-dialog-title" className="text-base font-semibold" style={{ color: "var(--text)" }}>
            {title}
          </h2>
        </div>
        <div className="px-6 py-5">
          <p id="info-dialog-desc" className="text-sm" style={{ color: "var(--text-muted)" }}>
            {message}
          </p>
          <div className="mt-6 flex justify-end">
            <button
              ref={okRef}
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg font-medium text-sm text-white transition-all duration-150 focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
              style={{
                background: "var(--accent)",
              }}
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
