"use client";

import {
  LayoutDashboard, Package, ArrowLeftRight, AlertTriangle,
  ClipboardList, Tag, Truck, ChevronDown, Boxes, X, Trash2,
} from "lucide-react";
import type { Tab } from "@/types";

const NAV: {
  id: Tab;
  label: string;
  Icon: React.ElementType;
  subs?: { id: string; label: string; Icon: React.ElementType }[];
}[] = [
  { id: "dashboard", label: "แดชบอร์ด", Icon: LayoutDashboard },
  {
    id: "products", label: "สินค้า", Icon: Package,
    subs: [
      { id: "all",        label: "สินค้าทั้งหมด",  Icon: Package       },
      { id: "low-stock",  label: "สินค้าใกล้หมด",  Icon: AlertTriangle },
      { id: "categories", label: "หมวดหมู่สินค้า", Icon: Tag           },
    ],
  },
  {
    id: "stock", label: "สต็อก", Icon: ArrowLeftRight,
    subs: [
      { id: "adjust",  label: "ปรับจำนวนสต็อก",      Icon: ArrowLeftRight },
      { id: "history", label: "ประวัติการเคลื่อนไหว", Icon: ClipboardList  },
    ],
  },
  { id: "suppliers", label: "ผู้จัดจำหน่าย", Icon: Truck },
];

interface SidebarProps {
  tab:              Tab;
  onSetTab:         (t: Tab) => void;
  productView:      string;
  onSetProductView: (v: "all" | "low-stock" | "categories") => void;
  stockView:        string;
  onSetStockView:   (v: "adjust" | "history") => void;
  open:             boolean;
  onClose:          () => void;
  lowStockCount:    number;
  connError:        string | null;
  loading:          boolean;
  onLoadSeed:       () => void;
}

export function Sidebar({
  tab, onSetTab, productView, onSetProductView,
  stockView, onSetStockView, open, onClose,
  lowStockCount, connError, loading, onLoadSeed,
}: SidebarProps) {
  return (
    <aside className={`fixed lg:relative inset-y-0 left-0 z-40 w-60 shrink-0 bg-slate-900 flex flex-col select-none
      transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Boxes size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Inventory</p>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Management System</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-slate-300 cursor-pointer">
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ id, label, Icon, subs }) => {
          const active = tab === id;
          return (
            <div key={id}>
              <button
                onClick={() => onSetTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150 cursor-pointer text-left group
                  ${active ? "bg-emerald-500/10 text-emerald-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`}
              >
                <Icon size={16} className="shrink-0" />
                <span className="flex-1">{label}</span>
                {id === "products" && lowStockCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                    {lowStockCount}
                  </span>
                )}
                {subs
                  ? <ChevronDown size={13} className={`text-slate-500 transition-transform duration-200 ${active ? "rotate-180 text-emerald-400/60" : ""}`} />
                  : active && <div className="w-1 h-1 rounded-full bg-emerald-400" />
                }
              </button>

              {subs && active && (
                <div className="mt-0.5 ml-2 pl-3 border-l border-slate-700/60 space-y-0.5 py-0.5">
                  {subs.map(sub => {
                    const subActive = id === "products" ? productView === sub.id : stockView === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          if (id === "products") onSetProductView(sub.id as "all" | "low-stock" | "categories");
                          else onSetStockView(sub.id as "adjust" | "history");
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium
                          transition-all cursor-pointer text-left
                          ${subActive ? "bg-emerald-500/15 text-emerald-300" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"}`}
                      >
                        <sub.Icon size={12} className="shrink-0" />
                        <span className="flex-1">{sub.label}</span>
                        {sub.id === "low-stock" && lowStockCount > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                            {lowStockCount}
                          </span>
                        )}
                        {subActive && sub.id !== "low-stock" && <div className="w-1 h-1 rounded-full bg-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full shrink-0 ${connError ? "bg-rose-500 shadow-rose-500/60" : "bg-emerald-400 shadow-emerald-400/60"} shadow-[0_0_6px]`} />
          <span className="text-[11px] text-slate-500 font-medium">
            {connError ? "ไม่ได้เชื่อมต่อ" : "เชื่อมต่อ Google Sheets"}
          </span>
        </div>
        <button
          onClick={() => {
            if (window.confirm("ลบข้อมูลทั้งหมดในชีตแล้วเติมข้อมูลตัวอย่างใหม่?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้"))
              onLoadSeed();
          }}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold
            text-rose-500/70 hover:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20
            transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 size={11} />รีเซ็ต &amp; โหลดข้อมูลใหม่
        </button>
      </div>
    </aside>
  );
}
