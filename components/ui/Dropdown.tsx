"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

type Option = { value: string; label: string };

type DropdownProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: ReactNode;
  className?: string;
};

export function Dropdown({ options, value, onChange, placeholder = "Select...", label, className = "" }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
    if (!open) setSearch("");
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && <span className="block text-xs font-medium text-[#737373] mb-1.5">{label}</span>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-lg px-3.5 py-2 text-sm text-left bg-[#050505] border border-[#1e1e1e] hover:border-[#2a2a2a] transition-colors"
      >
        <span className={selected ? "text-[#e8e8e8]" : "text-[#525252]"}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className={`w-4 h-4 text-[#525252] transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#111111] border border-[#1e1e1e] rounded-lg shadow-2xl shadow-black/40 animate-slide-up overflow-hidden">
          {options.length > 6 && (
            <div className="p-2 border-b border-[#1e1e1e]">
              <input
                ref={inputRef}
                type="text"
                className="input-field !py-1.5 !text-xs !rounded-md"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3.5 py-2 text-xs text-[#525252]">No results</li>
            )}
            {filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  className={`w-full text-left px-3.5 py-2 text-sm transition-colors ${
                    o.value === value ? "text-[#FF4000] bg-[#FF4000]/5" : "text-[#e8e8e8] hover:bg-[#191919]"
                  }`}
                  onClick={() => { onChange(o.value); setOpen(false); }}
                >
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
