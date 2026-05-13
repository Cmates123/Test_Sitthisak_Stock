"use client";

import {
  ArrowDown, ArrowUp, ArrowUpDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import type { SortDir } from "@/types";

export function SortIcon({ col, active, dir }: { col: string; active: string; dir: SortDir }) {
  if (col !== active) return <ArrowUpDown size={11} className="text-slate-300 ml-1 inline" />;
  return dir === "asc"
    ? <ArrowUp   size={11} className="text-emerald-500 ml-1 inline" />
    : <ArrowDown size={11} className="text-emerald-500 ml-1 inline" />;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />;
}

export function TableSkeleton({ cols }: { cols: number }) {
  const widths = ["w-36", "w-20", "w-24", "w-16", "w-12", "w-20", "w-16"];
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="border-b border-slate-50">
          {[...Array(cols)].map((_, j) => (
            <td key={j} className="px-5 py-4">
              <Skeleton className={`h-3.5 ${widths[j % widths.length]}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function Pagination({
  page, pageCount, total, onChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  onChange: (p: number) => void;
}) {
  const btn = "w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-default";
  return (
    <div className="px-6 py-3 border-t border-slate-50 flex items-center justify-between">
      <span className="text-xs text-slate-400">
        หน้า {page + 1} / {pageCount} ({total} รายการ)
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(0)}             disabled={page === 0}              className={btn}><ChevronsLeft  size={13} /></button>
        <button onClick={() => onChange(page - 1)}      disabled={page === 0}              className={btn}><ChevronLeft   size={13} /></button>
        <button onClick={() => onChange(page + 1)}      disabled={page >= pageCount - 1}   className={btn}><ChevronRight  size={13} /></button>
        <button onClick={() => onChange(pageCount - 1)} disabled={page >= pageCount - 1}   className={btn}><ChevronsRight size={13} /></button>
      </div>
    </div>
  );
}
