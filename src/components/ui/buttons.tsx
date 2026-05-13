"use client";

import { RefreshCw } from "lucide-react";

export function Btn({
  variant = "primary", loading, children, className = "", ...props
}: {
  variant?: "primary" | "danger" | "ghost" | "warning";
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = `flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`;
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 active:scale-[0.98]",
    danger:  "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 active:scale-[0.98]",
    warning: "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400 active:scale-[0.98]",
    ghost:   "border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-400",
  };
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading && <RefreshCw size={14} className="animate-spin" />}
      {children}
    </button>
  );
}
