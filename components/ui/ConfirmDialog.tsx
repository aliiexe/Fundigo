"use client";

import { useEffect, useRef } from "react";

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  loading?: boolean;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && confirmRef.current) {
      setTimeout(() => confirmRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    void Promise.resolve(onConfirm());
  };

  const isDanger = variant === "danger";

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
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="relative z-10 mx-auto w-full max-w-md rounded-xl border shadow-2xl animate-slide-up overflow-hidden"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
        }}
      >
        <div className="px-6 py-4 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
          <h2 id="confirm-dialog-title" className="text-base font-semibold" style={{ color: "var(--text)" }}>
            {title}
          </h2>
        </div>
        <div className="px-6 py-5">
          <p id="confirm-dialog-desc" className="text-sm" style={{ color: "var(--text-muted)" }}>
            {message}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 rounded-lg font-medium text-sm transition-all duration-150 border disabled:opacity-50"
              style={{
                color: "var(--text)",
                borderColor: "var(--border)",
                background: "var(--bg)",
              }}
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="px-5 py-2 rounded-lg font-medium text-sm text-white transition-all duration-150 disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
              style={
                isDanger
                  ? {
                      background: "var(--danger)",
                    }
                  : {
                      background: "var(--accent)",
                    }
              }
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  …
                </span>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
