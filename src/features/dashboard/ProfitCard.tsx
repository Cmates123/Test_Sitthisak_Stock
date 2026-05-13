"use client";

export function ProfitCard({ totalCost, totalSell }: { totalCost: number; totalSell: number }) {
  const profit   = totalSell - totalCost;
  const margin   = totalCost > 0 ? Math.round((profit / totalSell) * 100) : 0;
  const costPct  = Math.round((totalCost / totalSell) * 100);
  const fmt      = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 0 });
  const marginCls =
    margin >= 20 ? "bg-emerald-50 text-emerald-600" :
    margin >= 0  ? "bg-amber-50 text-amber-600"     : "bg-rose-50 text-rose-500";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-slate-800">กำไรรวมในสต็อก</p>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${marginCls}`}>
          margin {margin}%
        </span>
      </div>
      <div className="relative h-5 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div className="absolute inset-y-0 left-0 bg-slate-400 rounded-l-full transition-all duration-700" style={{ width: `${costPct}%` }} />
        <div className="absolute inset-y-0 bg-emerald-400 rounded-r-full transition-all duration-700" style={{ left: `${costPct}%`, right: 0 }} />
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-[11px] text-slate-400 font-medium mb-0.5">ต้นทุนรวม</p>
          <p className="text-sm font-bold font-mono text-slate-700">฿{fmt(totalCost)}</p>
        </div>
        <div className="border-x border-slate-100">
          <p className="text-[11px] text-slate-400 font-medium mb-0.5">ราคาขายรวม</p>
          <p className="text-sm font-bold font-mono text-slate-800">฿{fmt(totalSell)}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400 font-medium mb-0.5">กำไรรวม</p>
          <p className={`text-sm font-bold font-mono ${profit >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
            {profit >= 0 ? "+" : ""}฿{fmt(profit)}
          </p>
        </div>
      </div>
    </div>
  );
}
