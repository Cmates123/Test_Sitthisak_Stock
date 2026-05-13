"use client";

import {
  LayoutDashboard, Package, ArrowLeftRight, Truck,
  RefreshCw, Menu,
} from "lucide-react";
import type { Tab } from "@/types";

const TAB_META: Record<Tab, { label: string; Icon: React.ElementType }> = {
  dashboard: { label: "แดชบอร์ด",      Icon: LayoutDashboard  },
  products:  { label: "สินค้า",         Icon: Package          },
  stock:     { label: "สต็อก",          Icon: ArrowLeftRight   },
  suppliers: { label: "ผู้จัดจำหน่าย",  Icon: Truck            },
};

export function Header({
  tab, loading, onRefresh, onMenuOpen,
}: {
  tab:        Tab;
  loading:    boolean;
  onRefresh:  () => void;
  onMenuOpen: () => void;
}) {
  const { label, Icon } = TAB_META[tab];
  return (
    <header className="bg-white border-b border-slate-100 px-4 lg:px-6 py-3.5 flex items-center justify-between shrink-0 z-10">
      <div className="flex items-center gap-3">
        <button onClick={onMenuOpen} className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer">
          <Menu size={18} />
        </button>
        <div>
          <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Icon size={15} className="text-slate-400" />
            {label}
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
            {new Date().toLocaleDateString("th-TH", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
              timeZone: "Asia/Bangkok",
            })}
          </p>
        </div>
      </div>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700
          border border-slate-200 rounded-xl px-3.5 py-2 transition-all disabled:opacity-50 cursor-pointer"
      >
        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        <span className="hidden sm:inline">รีเฟรช</span>
      </button>
    </header>
  );
}
