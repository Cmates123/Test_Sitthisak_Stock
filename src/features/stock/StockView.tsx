"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeftRight, ClipboardList, TrendingUp, TrendingDown,
  ChevronRight, Search, Download, X,
} from "lucide-react";
import type { Product, Transaction, SortDir } from "@/types";
import {
  Btn, SortIcon, TableSkeleton, EmptyState, Pagination, ProductPicker,
} from "@/components/ui";

type StockView = "adjust" | "history";

interface StockViewProps {
  products:         Product[];
  transactions:     Transaction[];
  loading:          boolean;
  showToast:        (msg: string, type: "success" | "error") => void;
  refresh:          () => Promise<void>;
  presetProductId:  string;
  onClearPreset:    () => void;
  stockView:        StockView;
  onSetStockView:   (v: StockView) => void;
}

export function StockView({
  products, transactions, loading,
  showToast, refresh,
  presetProductId, onClearPreset,
  stockView, onSetStockView,
}: StockViewProps) {

  // ── Adjust form state
  const [adj,    setAdj]    = useState({ productId: "", adjustment: "", reason: "" });
  const [adjType, setAdjType] = useState<"IN" | "OUT">("IN");
  const [saving, setSaving] = useState(false);

  // Apply preset productId when it changes
  useEffect(() => {
    if (presetProductId) {
      setAdj(prev => ({ ...prev, productId: presetProductId }));
      setAdjType("IN");
      onClearPreset();
    }
  }, [presetProductId, onClearPreset]);

  // ── Transaction history state
  const PAGE = 20;
  const [txSort,   setTxSort]   = useState<{ col: string; dir: SortDir }>({ col: "createdAt", dir: "desc" });
  const [txPage,   setTxPage]   = useState(0);
  const [txFilter, setTxFilter] = useState<{ type: "ALL" | "IN" | "OUT"; product: string }>({ type: "ALL", product: "" });

  // ─── Derived data ──────────────────────────────────────────────────────────

  const adjQty    = parseInt(adj.adjustment) || 0;
  const adjNum    = adjType === "IN" ? adjQty : -adjQty;
  const adjProduct = products.find(p => p.id === adj.productId);

  const filteredTx = useMemo(() => {
    const arr = [...transactions].filter(t =>
      (txFilter.type === "ALL" || t.type === txFilter.type) &&
      (txFilter.product === "" || t.productName.toLowerCase().includes(txFilter.product.toLowerCase()))
    );
    const { col, dir } = txSort;
    arr.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if      (col === "createdAt")   { av = a.createdAt;   bv = b.createdAt; }
      else if (col === "productName") { av = a.productName; bv = b.productName; }
      else if (col === "type")        { av = a.type;        bv = b.type; }
      else if (col === "quantity")    { av = a.quantity;    bv = b.quantity; }
      if (typeof av === "string") return dir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return dir === "asc" ? av - (bv as number) : (bv as number) - av;
    });
    return arr;
  }, [transactions, txFilter, txSort]);

  const txPageCount = Math.ceil(filteredTx.length / PAGE);
  const pagedTx     = filteredTx.slice(txPage * PAGE, (txPage + 1) * PAGE);
  const toggleTxSort = (col: string) => { setTxSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" })); setTxPage(0); };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const qty = parseInt(adj.adjustment) || 0;
      const res  = await fetch("/api/stock/adjust", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId:  adj.productId,
          adjustment: adjType === "IN" ? qty : -qty,
          reason:     adj.reason,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        showToast(`${d.name}: ${d.previousStock} → ${d.newStock} ชิ้น`, "success");
        setAdj({ productId: "", adjustment: "", reason: "" });
        refresh();
      } else {
        showToast(json.error, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    const a = document.createElement("a");
    a.href = "/api/transactions/export";
    a.download = "transactions.csv";
    a.click();
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 max-w-7xl">

      {/* Adjust */}
      {stockView === "adjust" && (
        <div className="max-w-lg">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-800">ปรับจำนวนสต็อก</h2>
              <p className="text-xs text-slate-400 mt-0.5">ทุกการปรับจะถูกบันทึกเป็นประวัติเพื่อตรวจสอบย้อนหลัง</p>
            </div>
            <form onSubmit={handleAdjust} className="space-y-4">
              <ProductPicker products={products} value={adj.productId} onChange={id => setAdj(prev => ({ ...prev, productId: id }))} />

              {/* IN / OUT Toggle */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ประเภท <span className="text-rose-500">*</span></span>
                <div className="grid grid-cols-2 gap-2">
                  {(["IN", "OUT"] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAdjType(type)}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer
                        ${adjType === type
                          ? type === "IN" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-rose-400 bg-rose-50 text-rose-700"
                          : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                        }`}
                    >
                      {type === "IN" ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                      {type === "IN" ? "รับเข้า" : "จ่ายออก"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">จำนวน <span className="text-rose-500">*</span></span>
                <input
                  required type="number" min="1"
                  placeholder="เช่น 10, 50, 100"
                  value={adj.adjustment}
                  onChange={e => setAdj({ ...adj, adjustment: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
                <p className="text-[11px] text-slate-400">{adjType === "IN" ? "จำนวนที่รับเข้าสต็อก" : "จำนวนที่นำออกจากสต็อก"}</p>
              </div>

              {/* Reason Presets */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">เหตุผล / หมายเหตุ <span className="text-rose-500">*</span></span>
                <div className="flex flex-wrap gap-1.5">
                  {(adjType === "IN"
                    ? ["รับจากซัพพลายเออร์", "รับคืนจากลูกค้า", "ปรับยอดเพิ่ม"]
                    : ["ขายให้ลูกค้า", "สินค้าเสียหาย", "ใช้ภายใน", "ปรับยอดลด"]
                  ).map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAdj({ ...adj, reason: preset })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer
                        ${adj.reason === preset
                          ? "bg-slate-800 text-white border-slate-700"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                        }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  required
                  placeholder="หรือพิมพ์เหตุผลเอง…"
                  value={adj.reason}
                  onChange={e => setAdj({ ...adj, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Preview */}
              {adj.productId && adjNum !== 0 && adjProduct && (
                <div className={`rounded-xl border overflow-hidden ${adjNum > 0 ? "border-emerald-100" : "border-rose-100"}`}>
                  <div className={`px-4 py-2.5 flex items-center gap-2 text-xs font-bold ${adjNum > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                    {adjNum > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {adjNum > 0 ? "รับเข้า" : "จ่ายออก"} {Math.abs(adjNum)} ชิ้น
                  </div>
                  <div className="px-4 py-3 bg-white flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">ปัจจุบัน</p>
                      <p className="text-xl font-bold font-mono text-slate-700">{adjProduct.stockQuantity}</p>
                    </div>
                    <div className="flex items-center gap-1 text-slate-300">
                      <ChevronRight size={16} /><ChevronRight size={16} className="-ml-2" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">หลังปรับ</p>
                      <p className={`text-xl font-bold font-mono
                        ${adjProduct.stockQuantity + adjNum < 0 ? "text-rose-500" :
                          adjProduct.stockQuantity + adjNum < 5 ? "text-amber-600" : "text-emerald-600"}`}
                      >
                        {adjProduct.stockQuantity + adjNum < 0
                          ? <span className="text-sm">ไม่สามารถต่ำกว่า 0</span>
                          : adjProduct.stockQuantity + adjNum}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Btn type="submit" loading={saving} className="w-full" disabled={!adj.productId}>
                <ArrowLeftRight size={15} />บันทึกการปรับสต็อก
              </Btn>
            </form>
          </div>
        </div>
      )}

      {/* History */}
      {stockView === "history" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Type Filter */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
              {(["ALL", "IN", "OUT"] as const).map(type => (
                <button
                  key={type}
                  onClick={() => { setTxFilter(f => ({ ...f, type })); setTxPage(0); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer
                    ${txFilter.type === type
                      ? type === "IN" ? "bg-emerald-500 text-white shadow-sm" : type === "OUT" ? "bg-rose-500 text-white shadow-sm" : "bg-slate-800 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
                >
                  {type === "ALL" ? "ทั้งหมด" : type === "IN" ? "รับเข้า" : "จ่ายออก"}
                </button>
              ))}
            </div>

            {/* Product Search */}
            <div className="relative flex-1 min-w-40">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="กรองตามชื่อสินค้า…"
                value={txFilter.product}
                onChange={e => { setTxFilter(f => ({ ...f, product: e.target.value })); setTxPage(0); }}
                className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
              {txFilter.product && (
                <button onClick={() => setTxFilter(f => ({ ...f, product: "" }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Download size={13} />Export CSV
            </button>
            {(txFilter.type !== "ALL" || txFilter.product) && (
              <p className="text-xs text-slate-500">{filteredTx.length} รายการ</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">ประวัติการเคลื่อนไหว</h2>
              <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">{filteredTx.length} รายการ</span>
            </div>
            {loading ? (
              <div className="overflow-x-auto"><table className="w-full"><tbody><TableSkeleton cols={5} /></tbody></table></div>
            ) : filteredTx.length === 0 ? (
              <EmptyState icon={ClipboardList} title="ไม่พบรายการ" desc="ปรับเงื่อนไขการกรอง หรือเริ่มบันทึกการเคลื่อนไหวสต็อก"
                action={{ label: "บันทึกการปรับสต็อก", onClick: () => onSetStockView("adjust") }} />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b border-slate-100">
                        {[
                          { key: "createdAt",   label: "วันที่ / เวลา" },
                          { key: "productName", label: "สินค้า"        },
                          { key: "type",        label: "ประเภท"        },
                          { key: "quantity",    label: "จำนวน"         },
                          { key: "reason",      label: "เหตุผล"        },
                        ].map(col => (
                          <th
                            key={col.key}
                            onClick={() => col.key !== "reason" && toggleTxSort(col.key)}
                            className={`px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider
                              ${col.key === "type" || col.key === "quantity" ? "text-center" : ""}
                              ${col.key !== "reason" ? "cursor-pointer hover:text-slate-600 select-none" : ""}`}
                          >
                            {col.label}
                            {col.key !== "reason" && <SortIcon col={col.key} active={txSort.col} dir={txSort.dir} />}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {pagedTx.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <p className="text-xs font-medium text-slate-600">
                              {new Date(t.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" })}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {new Date(t.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Bangkok" })}
                            </p>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-800">{t.productName}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${t.type === "IN" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                              {t.type === "IN" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                              {t.type === "IN" ? "รับเข้า" : "จ่ายออก"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-700">{t.quantity}</td>
                          <td className="px-5 py-3.5 text-slate-500 text-xs">{t.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {txPageCount > 1 && (
                  <Pagination page={txPage} pageCount={txPageCount} total={filteredTx.length} onChange={setTxPage} />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
