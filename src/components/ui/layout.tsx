"use client";

import { ChevronRight } from "lucide-react";

export function EmptyState({ icon: Icon, title, desc, action }: {
  icon: React.ElementType;
  title: string;
  desc?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="py-16 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <Icon size={20} className="text-slate-400" />
      </div>
      <p className="text-slate-600 font-semibold text-sm">{title}</p>
      {desc && <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">{desc}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function StatCard({ label, value, sub, Icon, accent }: {
  label: string;
  value: string | number;
  sub?: string;
  Icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-300 group">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent} transition-transform duration-200 group-hover:scale-110`}>
          <Icon size={18} />
        </div>
        <ChevronRight size={14} className="text-slate-300 mt-1" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{value}</p>
        <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export function StockBar({ name, sku, stock, max }: {
  name: string;
  sku: string;
  stock: number;
  max: number;
}) {
  const pct   = max > 0 ? Math.min((stock / max) * 100, 100) : 0;
  const color =
    stock === 0 ? "bg-slate-300" :
    stock < 5   ? "bg-rose-500"  :
    stock < 15  ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-3 group">
      <div className="w-32 shrink-0">
        <p className="text-xs font-semibold text-slate-700 truncate group-hover:text-slate-900 transition-colors">{name}</p>
        <p className="text-[10px] font-mono text-slate-400">{sku}</p>
      </div>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ease-out ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-bold font-mono text-slate-600">{stock}</span>
    </div>
  );
}
