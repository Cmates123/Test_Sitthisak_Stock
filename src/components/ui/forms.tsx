"use client";

import { AlertCircle } from "lucide-react";

export function Input({
  label, required, hint, error, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </span>
      <input
        {...props}
        required={required}
        className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-800
          placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 cursor-text
          ${error
            ? "border-rose-300 focus:ring-rose-500/30 focus:border-rose-500"
            : "border-slate-200 focus:ring-emerald-500/30 focus:border-emerald-500"
          }`}
      />
      {error && (
        <p className="text-[11px] text-rose-500 flex items-center gap-1">
          <AlertCircle size={10} />{error}
        </p>
      )}
      {hint && !error && <p className="text-[11px] text-slate-400">{hint}</p>}
    </label>
  );
}

export function Select({
  label, required, hint, children, ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </span>
      <select
        {...props}
        required={required}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm
          text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30
          focus:border-emerald-500 transition-all duration-200 cursor-pointer appearance-none"
      >
        {children}
      </select>
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </label>
  );
}
