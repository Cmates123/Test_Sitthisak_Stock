"use client";

import { useEffect } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export function Toast({
  message, type, onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl
      text-sm font-medium border animate-in slide-in-from-top-2 duration-300 max-w-sm
      ${type === "success" ? "bg-white text-emerald-700 border-emerald-100" : "bg-white text-rose-700 border-rose-100"}`}
    >
      {type === "success"
        ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
        : <AlertCircle  size={16} className="text-rose-500 shrink-0" />
      }
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-1 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}

export function Modal({
  open, onClose, title, children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors" title="ปิด (Esc)">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
        <div className="px-6 pb-4 text-[10px] text-slate-400 text-right">
          กด <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-500">Esc</kbd> เพื่อปิด
        </div>
      </div>
    </div>
  );
}
