"use client";

export function Badge({ level }: { level: number }) {
  if (level === 0) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500">หมดสต็อก</span>;
  if (level < 5)   return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600">สินค้าใกล้หมด</span>;
  if (level < 15)  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600">สินค้าเหลือน้อย</span>;
  return               <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600">มีสินค้า</span>;
}

export function StockBadge({ qty, min }: { qty: number; min: number }) {
  if (qty === 0)      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500">หมดสต็อก</span>;
  if (qty <= min)     return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600">ใกล้หมด</span>;
  if (qty <= min * 2) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600">เหลือน้อย</span>;
  return                 <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600">มีสินค้า</span>;
}
