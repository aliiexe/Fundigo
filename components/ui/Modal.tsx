"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
};

export function Modal({ open, onClose, title, children, wide }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center p-6" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md animate-overlay-in" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        className={`relative z-10 mx-auto w-full max-h-[90vh] flex flex-col ${wide ? "max-w-2xl" : "max-w-lg"} bg-[#111111] border border-[#1e1e1e] rounded-xl shadow-2xl animate-slide-up overflow-hidden`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e1e] shrink-0">
          <h2 id="modal-title" className="text-base font-semibold text-[#e8e8e8]">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[#737373] hover:text-[#e8e8e8] hover:bg-[#191919] transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-6 overflow-y-auto flex-1 min-h-0">{children}</div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
}
