"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import type { Product } from "@/types";
import { Badge } from "./badges";

export function ProductPicker({
  products, value, onChange,
}: {
  products: Product[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);
  const ref               = useRef<HTMLDivElement>(null);
  const selected          = products.find(p => p.id === value) ?? null;
  const filtered          = products.filter(p =>
    query === "" ||
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.sku.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          สินค้า <span className="text-rose-500">*</span>
        </span>
        <div
          onClick={() => { if (!selected) setOpen(true); }}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm flex items-center
            gap-2 cursor-text focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all"
        >
          {selected ? (
            <>
              <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{selected.sku}</span>
              <span className="flex-1 text-slate-800 font-medium truncate">{selected.name}</span>
              <Badge level={selected.stockQuantity} />
              <span className="font-mono text-xs font-bold text-slate-600 shrink-0">{selected.stockQuantity} ชิ้น</span>
              <button onClick={clear} className="text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"><X size={13} /></button>
            </>
          ) : (
            <>
              <Search size={13} className="text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus={open}
                placeholder="พิมพ์ชื่อสินค้าหรือรหัส SKU…"
                value={query}
                onChange={e => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                className="flex-1 bg-transparent text-sm placeholder:text-slate-400 focus:outline-none"
              />
              <ChevronDown size={13} className="text-slate-400 shrink-0" />
            </>
          )}
        </div>
        <p className="text-[11px] text-slate-400">ค้นหาสินค้าจากชื่อหรือรหัส SKU</p>
      </label>

      {open && !selected && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400">ไม่พบสินค้า &ldquo;{query}&rdquo;</div>
          ) : (
            filtered.map(p => (
              <button
                key={p.id}
                onClick={() => { onChange(p.id); setOpen(false); setQuery(""); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
              >
                <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{p.sku}</span>
                <span className="flex-1 text-sm text-slate-800 font-medium truncate">{p.name}</span>
                <Badge level={p.stockQuantity} />
                <span className={`text-xs font-bold font-mono shrink-0 ${p.stockQuantity < 5 ? "text-rose-600" : "text-slate-600"}`}>
                  {p.stockQuantity}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
