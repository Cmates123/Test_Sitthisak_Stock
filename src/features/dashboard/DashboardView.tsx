"use client";

import { useState, useMemo } from "react";
import {
  Package, PackagePlus, ArrowLeftRight, AlertTriangle, Tag,
  BarChart3, DollarSign, Activity, ChevronRight,
  ArrowUpRight, ArrowDownRight, Sparkles, RefreshCw,
} from "lucide-react";
import type { Category, Product, Transaction, Tab } from "@/types";
import { StatCard, StockBar, Skeleton } from "@/components/ui";
import { ProfitCard } from "./ProfitCard";

interface DashboardViewProps {
  products:         Product[];
  categories:       Category[];
  lowStock:         Product[];
  transactions:     Transaction[];
  loading:          boolean;
  onSetTab:         (t: Tab) => void;
  onSetProductView: (v: "all" | "low-stock" | "categories") => void;
  onSetStockView:   (v: "adjust" | "history") => void;
  onAddProduct:     () => void;
  onGoAdjust:       (productId: string) => void;
  onLoadSeed:       () => void;
}

export function DashboardView({
  products, categories, lowStock, transactions, loading,
  onSetTab, onSetProductView, onSetStockView, onAddProduct, onGoAdjust, onLoadSeed,
}: DashboardViewProps) {
  const [showAll, setShowAll] = useState(false);

  const totalCost      = products.reduce((s, p) => s + p.costPrice * p.stockQuantity, 0);
  const totalSellValue = products.reduce((s, p) => s + (p.sellingPrice ?? 0) * p.stockQuantity, 0);
  const maxStock       = Math.max(...products.map(p => p.stockQuantity), 1);
  const bkkDate        = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const todayTx        = transactions.filter(t => bkkDate(new Date(t.createdAt)) === bkkDate(new Date())).length;
  const isFirstRun     = !loading && products.length === 0 && categories.length === 0;

  const catChartData = useMemo(() => {
    const map: Record<string, { name: string; value: number; count: number }> = {};
    products.forEach(p => {
      const key  = p.category?.id ?? "__none__";
      const name = p.category?.name ?? "ไม่มีหมวดหมู่";
      if (!map[key]) map[key] = { name, value: 0, count: 0 };
      map[key].value += p.costPrice * p.stockQuantity;
      map[key].count += 1;
    });
    const arr = Object.values(map).sort((a, b) => b.value - a.value);
    const max = Math.max(...arr.map(x => x.value), 1);
    return arr.map(x => ({ ...x, pct: Math.round((x.value / max) * 100) }));
  }, [products]);

  if (isFirstRun) {
    return (
      <div className="space-y-5 max-w-7xl">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30">
              <Sparkles size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">ยินดีต้อนรับสู่ระบบจัดการสต็อก</h2>
            <p className="text-sm text-slate-400 mb-8 max-w-md mx-auto">เริ่มต้นใช้งานใน 3 ขั้นตอน</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto mb-8 text-left">
              {[
                { step: "1", label: "สร้างหมวดหมู่", desc: "จัดกลุ่มสินค้าตามประเภท เช่น IT, เฟอร์นิเจอร์",    tab: "products" as Tab, view: "categories", Icon: Tag,           color: "bg-purple-500" },
                { step: "2", label: "เพิ่มสินค้า",   desc: "ใส่ข้อมูลสินค้า ราคาทุน และจำนวนเริ่มต้น",       tab: "products" as Tab, view: "",           Icon: PackagePlus,   color: "bg-blue-500"   },
                { step: "3", label: "ปรับสต็อก",     desc: "บันทึกการรับเข้าและจ่ายออกทุกครั้ง",              tab: "stock"    as Tab, view: "",           Icon: ArrowLeftRight, color: "bg-emerald-500" },
              ].map(s => (
                <button
                  key={s.step}
                  onClick={() => {
                    onSetTab(s.tab);
                    if (s.view === "categories") onSetProductView("categories");
                  }}
                  className="flex flex-col gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer text-left group"
                >
                  <div className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center`}>
                    <s.Icon size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">ขั้นที่ {s.step} — {s.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={onLoadSeed}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition-all cursor-pointer border border-white/10"
            >
              {loading ? <RefreshCw size={12} className="animate-spin" /> : <Package size={12} />}
              หรือโหลดข้อมูลตัวอย่างเพื่อลองใช้งาน
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="สินค้าทั้งหมด"    value={products.length}   sub={`ใน ${categories.length} หมวดหมู่`}   Icon={Package}       accent="bg-blue-50 text-blue-500" />
        <StatCard label="สินค้าใกล้หมด"    value={lowStock.length}   sub="ต่ำกว่าสต็อกขั้นต่ำ"                  Icon={AlertTriangle} accent="bg-rose-50 text-rose-500" />
        <StatCard
          label="มูลค่าสต็อก (ทุน)"
          value={`฿${totalCost.toLocaleString("th-TH", { maximumFractionDigits: 0 })}`}
          sub={totalSellValue > 0 ? `ราคาขาย ฿${totalSellValue.toLocaleString("th-TH", { maximumFractionDigits: 0 })}` : "คำนวณจากราคาทุน"}
          Icon={DollarSign}
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard label="กิจกรรมวันนี้" value={todayTx} sub={`รวม ${transactions.length} รายการ`} Icon={Activity} accent="bg-purple-50 text-purple-500" />
      </div>

      {/* Profit Summary */}
      {totalSellValue > 0 && <ProfitCard totalCost={totalCost} totalSell={totalSellValue} />}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3 space-y-5">
          {/* Stock Level Bars */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800">ระดับสต็อกสินค้า</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">ภาพรวมสินค้าทั้งหมด</p>
              </div>
            </div>
            {loading ? (
              <div className="space-y-3.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-32 h-8 shrink-0" />
                    <Skeleton className="flex-1 h-2 rounded-full" />
                    <Skeleton className="w-8 h-4" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3.5">
                {(showAll ? products : products.slice(0, 9)).map(p => (
                  <StockBar key={p.id} name={p.name} sku={p.sku} stock={p.stockQuantity} max={maxStock} />
                ))}
                {products.length > 9 && (
                  <button
                    onClick={() => setShowAll(v => !v)}
                    className="text-xs text-slate-400 hover:text-emerald-500 text-center pt-1 w-full cursor-pointer transition-colors"
                  >
                    {showAll ? "▲ แสดงน้อยลง" : `+${products.length - 9} สินค้าเพิ่มเติม ▼`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Category Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={15} className="text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800">มูลค่าสต็อกตามหมวดหมู่</h3>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-24 h-4 shrink-0" />
                    <Skeleton className="flex-1 h-3 rounded-full" />
                    <Skeleton className="w-16 h-4" />
                  </div>
                ))}
              </div>
            ) : catChartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">ยังไม่มีข้อมูล</p>
            ) : (
              <div className="space-y-3">
                {catChartData.map((c, i) => {
                  const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-rose-500"];
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-28 shrink-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{c.name}</p>
                        <p className="text-[10px] text-slate-400">{c.count} สินค้า</p>
                      </div>
                      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${colors[i % colors.length]}`} style={{ width: `${c.pct}%` }} />
                      </div>
                      <span className="w-24 text-right text-xs font-bold font-mono text-slate-600 shrink-0">
                        ฿{c.value.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">กิจกรรมล่าสุด</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">การเคลื่อนไหวสต็อก</p>
            </div>
            <button
              onClick={() => { onSetTab("stock"); onSetStockView("history"); }}
              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              ดูทั้งหมด <ChevronRight size={12} />
            </button>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-32" /><Skeleton className="h-2.5 w-24" /></div>
                  <Skeleton className="w-8 h-4" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">ยังไม่มีรายการ</div>
          ) : (
            <div className="space-y-1 flex-1">
              {[...transactions].reverse().slice(0, 7).map(t => (
                <div key={t.id} className="flex items-center gap-3 py-2 rounded-xl hover:bg-slate-50 px-2 -mx-2 transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${t.type === "IN" ? "bg-emerald-50" : "bg-rose-50"}`}>
                    {t.type === "IN"
                      ? <ArrowUpRight   size={13} className="text-emerald-600" />
                      : <ArrowDownRight size={13} className="text-rose-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{t.productName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{t.reason}</p>
                  </div>
                  <span className={`text-xs font-bold font-mono shrink-0 ${t.type === "IN" ? "text-emerald-600" : "text-rose-600"}`}>
                    {t.type === "IN" ? "+" : "-"}{t.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <AlertTriangle size={15} className="text-rose-500 shrink-0" />
            <p className="text-sm font-bold text-rose-800">{lowStock.length} รายการต้องเติมสต็อก</p>
            <button
              onClick={() => { onSetTab("stock"); onSetStockView("adjust"); }}
              className="ml-auto text-xs font-semibold text-rose-600 hover:text-rose-800 underline underline-offset-2 cursor-pointer"
            >
              เติมสต็อกเลย
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(p => (
              <button
                key={p.id}
                onClick={() => onGoAdjust(p.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer hover:scale-105 transition-transform
                  ${p.stockQuantity === 0 ? "bg-slate-800 text-white border-slate-700" : "bg-white text-rose-700 border-rose-200"}`}
              >
                <span className="font-mono">{p.sku}</span>
                <span className="font-normal opacity-60">|</span>
                <span>{p.name}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${p.stockQuantity === 0 ? "bg-white/10 text-slate-300" : "bg-rose-100 text-rose-600"}`}>
                  {p.stockQuantity === 0 ? "หมด" : p.stockQuantity}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "เพิ่มสินค้า",   Icon: PackagePlus,    onClick: onAddProduct,                                                            cls: "bg-blue-600 hover:bg-blue-700" },
          { label: "ปรับสต็อก",     Icon: ArrowLeftRight, onClick: () => { onSetTab("stock"); onSetStockView("adjust"); },                  cls: "bg-emerald-600 hover:bg-emerald-700" },
          { label: "เพิ่มหมวดหมู่", Icon: Tag,            onClick: () => { onSetTab("products"); onSetProductView("categories"); },        cls: "bg-purple-600 hover:bg-purple-700" },
        ].map((a, i) => (
          <button
            key={i}
            onClick={a.onClick}
            className={`flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-[0.98] cursor-pointer shadow-sm ${a.cls}`}
          >
            <a.Icon size={16} />{a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
