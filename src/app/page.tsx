"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  LayoutDashboard, Package, PackagePlus, ArrowLeftRight,
  AlertTriangle, ClipboardList, Tag, RefreshCw,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
  ChevronRight, ArrowUpRight, ArrowDownRight, Boxes,
  DollarSign, Activity, Shield, X, Pencil, Trash2, Search,
  Menu, ChevronDown, Sparkles, Plus, Truck, Download, Upload,
  ChevronLeft, ChevronsLeft, ChevronsRight, ArrowUpDown,
  ArrowUp, ArrowDown, BarChart3,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category { id: string; name: string; description?: string }
interface Product {
  id: string; name: string; sku: string; costPrice: number;
  stockQuantity: number; category: { id: string; name: string } | null;
  createdAt: string; updatedAt: string;
  sellingPrice: number | null; minStock: number;
}
interface Transaction {
  id: string; productId: string; productName: string;
  type: "IN" | "OUT"; quantity: number; reason: string; createdAt: string;
}
interface Supplier {
  id: string; name: string; contactName: string; phone: string; email: string; createdAt: string;
}
type Tab = "dashboard" | "products" | "stock" | "suppliers";
type SortDir = "asc" | "desc";

const NAV: {
  id: Tab; label: string; Icon: React.ElementType;
  subs?: { id: string; label: string; Icon: React.ElementType }[];
}[] = [
  { id: "dashboard", label: "แดชบอร์ด", Icon: LayoutDashboard },
  {
    id: "products", label: "สินค้า", Icon: Package,
    subs: [
      { id: "all",        label: "สินค้าทั้งหมด",  Icon: Package },
      { id: "low-stock",  label: "สินค้าใกล้หมด",  Icon: AlertTriangle },
      { id: "categories", label: "หมวดหมู่สินค้า", Icon: Tag },
    ],
  },
  {
    id: "stock", label: "สต็อก", Icon: ArrowLeftRight,
    subs: [
      { id: "adjust",  label: "ปรับจำนวนสต็อก",       Icon: ArrowLeftRight },
      { id: "history", label: "ประวัติการเคลื่อนไหว",  Icon: ClipboardList },
    ],
  },
  { id: "suppliers", label: "ผู้จัดจำหน่าย", Icon: Truck },
];

// ─── Primitives ───────────────────────────────────────────────────────────────
function Input({
  label, required, hint, error, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </span>
      <input
        {...props}
        required={required}
        className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 cursor-text ${
          error ? "border-rose-300 focus:ring-rose-500/30 focus:border-rose-500"
                : "border-slate-200 focus:ring-emerald-500/30 focus:border-emerald-500"}`}
      />
      {error && <p className="text-[11px] text-rose-500 flex items-center gap-1"><AlertCircle size={10} />{error}</p>}
      {hint && !error && <p className="text-[11px] text-slate-400">{hint}</p>}
    </label>
  );
}

function Select({ label, required, hint, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </span>
      <select {...props} required={required}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-200 cursor-pointer appearance-none">
        {children}
      </select>
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </label>
  );
}

function Btn({ variant = "primary", loading, children, className = "", ...props }: {
  variant?: "primary" | "danger" | "ghost" | "warning";
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 active:scale-[0.98]",
    danger:  "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 active:scale-[0.98]",
    warning: "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400 active:scale-[0.98]",
    ghost:   "border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-400",
  };
  return (
    <button {...props} disabled={loading || props.disabled} className={`${base} ${variants[variant]} ${className}`}>
      {loading && <RefreshCw size={14} className="animate-spin" />}
      {children}
    </button>
  );
}


function Badge({ level }: { level: number }) {
  if (level === 0) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500">หมดสต็อก</span>;
  if (level < 5)   return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600">สินค้าใกล้หมด</span>;
  if (level < 15)  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600">สินค้าเหลือน้อย</span>;
  return                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600">มีสินค้า</span>;
}

function StockBadge({ qty, min }: { qty: number; min: number }) {
  if (qty === 0)    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500">หมดสต็อก</span>;
  if (qty <= min)   return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600">ใกล้หมด</span>;
  if (qty <= min*2) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600">เหลือน้อย</span>;
  return                   <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600">มีสินค้า</span>;
}

function SortIcon({ col, active, dir }: { col: string; active: string; dir: SortDir }) {
  if (col !== active) return <ArrowUpDown size={11} className="text-slate-300 ml-1 inline" />;
  return dir === "asc" ? <ArrowUp size={11} className="text-emerald-500 ml-1 inline" /> : <ArrowDown size={11} className="text-emerald-500 ml-1 inline" />;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />;
}

function TableSkeleton({ cols }: { cols: number }) {
  const widths = ["w-36", "w-20", "w-24", "w-16", "w-12", "w-20", "w-16"];
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="border-b border-slate-50">
          {[...Array(cols)].map((_, j) => (
            <td key={j} className="px-5 py-4"><Skeleton className={`h-3.5 ${widths[j % widths.length]}`} /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

function EmptyState({ icon: Icon, title, desc, action }: {
  icon: React.ElementType; title: string; desc?: string;
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
        <button onClick={action.onClick} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer">
          {action.label}
        </button>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, Icon, accent }: {
  label: string; value: string | number; sub?: string;
  Icon: React.ElementType; accent: string;
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

function StockBar({ name, sku, stock, max }: { name: string; sku: string; stock: number; max: number }) {
  const pct = max > 0 ? Math.min((stock / max) * 100, 100) : 0;
  const barColor = stock === 0 ? "bg-slate-300" : stock < 5 ? "bg-rose-500" : stock < 15 ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-3 group">
      <div className="w-32 shrink-0">
        <p className="text-xs font-semibold text-slate-700 truncate group-hover:text-slate-900 transition-colors">{name}</p>
        <p className="text-[10px] font-mono text-slate-400">{sku}</p>
      </div>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-bold font-mono text-slate-600">{stock}</span>
    </div>
  );
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium border animate-in slide-in-from-top-2 duration-300 max-w-sm ${
      type === "success" ? "bg-white text-emerald-700 border-emerald-100" : "bg-white text-rose-700 border-rose-100"
    }`}>
      {type === "success" ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> : <AlertCircle size={16} className="text-rose-500 shrink-0" />}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-1 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"><X size={14} /></button>
    </div>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors" title="ปิด (Esc)"><X size={16} /></button>
        </div>
        <div className="p-6">{children}</div>
        <div className="px-6 pb-4 text-[10px] text-slate-400 text-right">กด <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-500">Esc</kbd> เพื่อปิด</div>
      </div>
    </div>
  );
}

function ProductPicker({ products, value, onChange }: {
  products: Product[]; value: string; onChange: (id: string) => void;
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
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const clear = (e: React.MouseEvent) => { e.stopPropagation(); onChange(""); setQuery(""); setOpen(false); };

  return (
    <div ref={ref} className="relative">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">สินค้า <span className="text-rose-500">*</span></span>
        <div onClick={() => { if (!selected) setOpen(true); }}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm flex items-center gap-2 cursor-text focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all">
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
              <input type="text" autoFocus={open} placeholder="พิมพ์ชื่อสินค้าหรือรหัส SKU…"
                value={query} onChange={e => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
                className="flex-1 bg-transparent text-sm placeholder:text-slate-400 focus:outline-none" />
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
              <button key={p.id} onClick={() => { onChange(p.id); setOpen(false); setQuery(""); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0">
                <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{p.sku}</span>
                <span className="flex-1 text-sm text-slate-800 font-medium truncate">{p.name}</span>
                <Badge level={p.stockQuantity} />
                <span className={`text-xs font-bold font-mono shrink-0 ${p.stockQuantity < 5 ? "text-rose-600" : "text-slate-600"}`}>{p.stockQuantity}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]           = useState<Tab>("dashboard");
  const [productView, setProductView] = useState<"all" | "low-stock" | "categories">("all");
  const [stockView, setStockView]     = useState<"adjust" | "history">("adjust");

  const [products, setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lowStock, setLowStock]   = useState<Product[]>([]);
  const [transactions, setTx]     = useState<Transaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [connError, setConnError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAllStock, setShowAllStock] = useState(false);
  const [migrating, setMigrating]       = useState(false);
  const [updatingHeaders, setUpdatingHeaders] = useState(false);

  // Modals
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editModal, setEditModal]   = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [editForm, setEditForm]     = useState({ name: "", sku: "", costPrice: "", sellingPrice: "", minStock: "5", categoryId: "" });
  const [saving, setSaving]         = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "product" | "category" | "supplier"; id: string; name: string } | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [supplierModal, setSupplierModal] = useState<{ open: boolean; supplier: Supplier | null }>({ open: false, supplier: null });
  const [supplierForm, setSupplierForm] = useState({ name: "", contactName: "", phone: "", email: "" });
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importParsed, setImportParsed] = useState<Record<string, string>[] | null>(null);
  const [importing, setImporting]   = useState(false);

  // Forms
  const [form, setForm] = useState({ name: "", sku: "", costPrice: "", sellingPrice: "", minStock: "5", stockQuantity: "0", categoryId: "" });
  const [adj, setAdj]       = useState({ productId: "", adjustment: "", reason: "" });
  const [adjType, setAdjType] = useState<"IN" | "OUT">("IN");
  const [cat, setCat]   = useState({ name: "", description: "" });

  // Sort & Pagination
  const PAGE = 20;
  const [productSort, setProductSort] = useState<{ col: string; dir: SortDir }>({ col: "name", dir: "asc" });
  const [txSort, setTxSort]           = useState<{ col: string; dir: SortDir }>({ col: "createdAt", dir: "desc" });
  const [productPage, setProductPage] = useState(0);
  const [txPage, setTxPage]           = useState(0);

  // Filters
  const [search, setSearch]     = useState("");
  const [txFilter, setTxFilter] = useState<{ type: "ALL" | "IN" | "OUT"; product: string }>({ type: "ALL", product: "" });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true); setConnError(null);
    try {
      const [pr, cr, lr, tr, sr] = await Promise.all([
        fetch("/api/products"), fetch("/api/categories"),
        fetch("/api/products/low-stock"), fetch("/api/stock/transactions"),
        fetch("/api/suppliers"),
      ]);
      const [p, c, l, t, s] = await Promise.all([pr.json(), cr.json(), lr.json(), tr.json(), sr.json()]);
      if (p.success) setProducts(p.data);
      if (c.success) setCategories(c.data);
      if (l.success) setLowStock(l.data);
      if (t.success) setTx(t.data);
      if (s.success) setSuppliers(s.data);
    } catch {
      setConnError("เชื่อมต่อ Google Sheets ไม่ได้ — ตรวจสอบ credentials ใน .env");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { setSidebarOpen(false); }, [tab]);

  // Handlers
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, sku: form.sku, costPrice: parseFloat(form.costPrice), stockQuantity: parseInt(form.stockQuantity), categoryId: form.categoryId, sellingPrice: form.sellingPrice ? parseFloat(form.sellingPrice) : undefined, minStock: parseInt(form.minStock) || 5 }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`เพิ่ม "${form.name}" เรียบร้อยแล้ว`, "success");
        setForm({ name: "", sku: "", costPrice: "", sellingPrice: "", minStock: "5", stockQuantity: "0", categoryId: "" });
        setAddProductOpen(false); fetchAll();
      } else showToast(json.error, "error");
    } finally { setLoading(false); }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const qty = parseInt(adj.adjustment) || 0;
      const res = await fetch("/api/stock/adjust", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: adj.productId, adjustment: adjType === "IN" ? qty : -qty, reason: adj.reason }),
      });
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        showToast(`${d.name}: ${d.previousStock} → ${d.newStock} ชิ้น`, "success");
        setAdj({ productId: "", adjustment: "", reason: "" });
        fetchAll();
      } else showToast(json.error, "error");
    } finally { setLoading(false); }
  };

  const handleAddCat = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cat),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`สร้างหมวดหมู่ "${cat.name}" แล้ว`, "success");
        setCat({ name: "", description: "" }); fetchAll();
      } else showToast(json.error, "error");
    } finally { setLoading(false); }
  };

  const openEdit = (p: Product) => {
    setEditForm({ name: p.name, sku: p.sku, costPrice: String(p.costPrice), sellingPrice: p.sellingPrice != null ? String(p.sellingPrice) : "", minStock: String(p.minStock), categoryId: p.category?.id ?? "" });
    setEditModal({ open: true, product: p });
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.product) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${editModal.product.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editForm.name, sku: editForm.sku, costPrice: parseFloat(editForm.costPrice), categoryId: editForm.categoryId, sellingPrice: editForm.sellingPrice ? parseFloat(editForm.sellingPrice) : null, minStock: parseInt(editForm.minStock) || 5 }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`อัปเดต "${editForm.name}" เรียบร้อย`, "success");
        setEditModal({ open: false, product: null }); fetchAll();
      } else showToast(json.error, "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const url = deleteConfirm.type === "product"
        ? `/api/products/${deleteConfirm.id}`
        : deleteConfirm.type === "supplier"
          ? `/api/suppliers/${deleteConfirm.id}`
          : `/api/categories/${deleteConfirm.id}`;
      const res = await fetch(url, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast(`ลบ "${deleteConfirm.name}" แล้ว`, "success");
        setDeleteConfirm(null); fetchAll();
      } else showToast(json.error, "error");
    } finally { setDeleting(false); }
  };

  const goAdjust = (productId: string) => {
    setAdj(prev => ({ ...prev, productId }));
    setTab("stock"); setStockView("adjust");
  };

  const handleUpdateHeaders = async () => {
    setUpdatingHeaders(true);
    try {
      const res = await fetch("/api/update-headers");
      const json = await res.json();
      if (json.success) showToast(json.message, "success");
      else showToast(json.error, "error");
    } finally { setUpdatingHeaders(false); }
  };

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const res = await fetch("/api/migrate-timestamps");
      const json = await res.json();
      if (json.success) { showToast(json.message, "success"); fetchAll(); }
      else showToast(json.error, "error");
    } finally { setMigrating(false); }
  };

  const loadSeedData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seed");
      const json = await res.json();
      if (json.success) { showToast("โหลดข้อมูลตัวอย่างแล้ว!", "success"); fetchAll(); }
      else showToast(json.error, "error");
    } finally { setLoading(false); }
  };

  const handleQuickAdjust = async (productId: string, delta: number) => {
    const res = await fetch("/api/stock/adjust", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, adjustment: delta, reason: delta > 0 ? "ปรับเพิ่มด่วน" : "ปรับลดด่วน" }),
    });
    const json = await res.json();
    if (json.success) { showToast(`${json.data.name}: ${json.data.previousStock} → ${json.data.newStock}`, "success"); fetchAll(); }
    else showToast(json.error, "error");
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingSupplier(true);
    try {
      const isEdit = !!supplierModal.supplier;
      const url = isEdit ? `/api/suppliers/${supplierModal.supplier!.id}` : "/api/suppliers";
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(supplierForm) });
      const json = await res.json();
      if (json.success) { showToast(isEdit ? "แก้ไขผู้จัดจำหน่ายแล้ว" : `เพิ่ม "${supplierForm.name}" แล้ว`, "success"); setSupplierModal({ open: false, supplier: null }); fetchAll(); }
      else showToast(json.error, "error");
    } finally { setSavingSupplier(false); }
  };

  const openEditSupplier = (s: Supplier) => {
    setSupplierForm({ name: s.name, contactName: s.contactName, phone: s.phone, email: s.email });
    setSupplierModal({ open: true, supplier: s });
  };

  const parseCSV = () => {
    const lines = importText.trim().split("\n").filter(Boolean);
    if (lines.length < 2) { showToast("CSV ต้องมีหัวตารางและข้อมูลอย่างน้อย 1 แถว", "error"); return; }
    const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim().toLowerCase());
    const colMap: Record<string, string> = {
      "name": "name", "ชื่อสินค้า": "name",
      "sku": "sku", "รหัส sku": "sku", "รหัสsku": "sku",
      "costprice": "costPrice", "ราคาทุน": "costPrice",
      "sellingprice": "sellingPrice", "ราคาขาย": "sellingPrice",
      "stockquantity": "stockQuantity", "จำนวน": "stockQuantity",
      "minstock": "minStock", "สต็อกขั้นต่ำ": "minStock",
      "categoryid": "categoryId", "รหัสหมวดหมู่": "categoryId",
    };
    const mapped = headers.map(h => colMap[h] ?? h);
    const rows = lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.replace(/^"|"$/g, "").trim());
      const obj: Record<string, string> = {};
      mapped.forEach((k, i) => { obj[k] = vals[i] ?? ""; });
      return obj;
    });
    setImportParsed(rows);
  };

  const handleImport = async () => {
    if (!importParsed) return;
    setImporting(true);
    try {
      const res = await fetch("/api/products/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows: importParsed }) });
      const json = await res.json();
      if (json.success) { showToast(`นำเข้าสำเร็จ ${json.imported} รายการ, ข้ามไป ${json.skipped} รายการ`, "success"); setImportOpen(false); setImportText(""); setImportParsed(null); fetchAll(); }
      else showToast(json.error, "error");
    } finally { setImporting(false); }
  };

  const exportCSV = (url: string, filename: string) => {
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  };

  // Derived
  const totalValue     = products.reduce((s, p) => s + p.costPrice * p.stockQuantity, 0);
  const totalSellValue = products.reduce((s, p) => s + (p.sellingPrice ?? 0) * p.stockQuantity, 0);
  const bkkDate        = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const todayTx        = transactions.filter(t => bkkDate(new Date(t.createdAt)) === bkkDate(new Date())).length;
  const maxStock       = Math.max(...products.map(p => p.stockQuantity), 1);
  const adjQty         = parseInt(adj.adjustment) || 0;
  const adjNum         = adjType === "IN" ? adjQty : -adjQty;
  const adjProduct     = products.find(p => p.id === adj.productId);
  const isFirstRun     = !loading && products.length === 0 && categories.length === 0;

  // Category stock chart data
  const catChartData = useMemo(() => {
    const map: Record<string, { name: string; value: number; count: number }> = {};
    products.forEach(p => {
      const key = p.category?.id ?? "__none__";
      const name = p.category?.name ?? "ไม่มีหมวดหมู่";
      if (!map[key]) map[key] = { name, value: 0, count: 0 };
      map[key].value += p.costPrice * p.stockQuantity;
      map[key].count += 1;
    });
    const arr = Object.values(map).sort((a, b) => b.value - a.value);
    const max = Math.max(...arr.map(x => x.value), 1);
    return arr.map(x => ({ ...x, pct: Math.round((x.value / max) * 100) }));
  }, [products]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.category?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const sortedProducts = useMemo(() => {
    const arr = [...filteredProducts];
    const { col, dir } = productSort;
    arr.sort((a, b) => {
      let av: string | number = "", bv: string | number = "";
      if (col === "name") { av = a.name; bv = b.name; }
      else if (col === "sku") { av = a.sku; bv = b.sku; }
      else if (col === "costPrice") { av = a.costPrice; bv = b.costPrice; }
      else if (col === "sellingPrice") { av = a.sellingPrice ?? -1; bv = b.sellingPrice ?? -1; }
      else if (col === "stockQuantity") { av = a.stockQuantity; bv = b.stockQuantity; }
      else if (col === "minStock") { av = a.minStock; bv = b.minStock; }
      else if (col === "category") { av = a.category?.name ?? ""; bv = b.category?.name ?? ""; }
      if (typeof av === "string") return dir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return dir === "asc" ? av - (bv as number) : (bv as number) - av;
    });
    return arr;
  }, [filteredProducts, productSort]);

  const productPageCount = Math.ceil(sortedProducts.length / PAGE);
  const pagedProducts    = sortedProducts.slice(productPage * PAGE, (productPage + 1) * PAGE);

  const toggleProductSort = (col: string) => {
    setProductSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
    setProductPage(0);
  };

  const filteredTx = useMemo(() => {
    const arr = [...transactions].filter(t =>
      (txFilter.type === "ALL" || t.type === txFilter.type) &&
      (txFilter.product === "" || t.productName.toLowerCase().includes(txFilter.product.toLowerCase()))
    );
    const { col, dir } = txSort;
    arr.sort((a, b) => {
      let av: string | number = "", bv: string | number = "";
      if (col === "createdAt") { av = a.createdAt; bv = b.createdAt; }
      else if (col === "productName") { av = a.productName; bv = b.productName; }
      else if (col === "type") { av = a.type; bv = b.type; }
      else if (col === "quantity") { av = a.quantity; bv = b.quantity; }
      if (typeof av === "string") return dir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return dir === "asc" ? av - (bv as number) : (bv as number) - av;
    });
    return arr;
  }, [transactions, txFilter, txSort]);

  const txPageCount = Math.ceil(filteredTx.length / PAGE);
  const pagedTx     = filteredTx.slice(txPage * PAGE, (txPage + 1) * PAGE);

  const toggleTxSort = (col: string) => {
    setTxSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
    setTxPage(0);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Modals ───────────────────────────────────────────────────── */}

      {/* เพิ่มสินค้า */}
      <Modal open={addProductOpen} onClose={() => setAddProductOpen(false)} title="เพิ่มสินค้าใหม่">
        <form onSubmit={handleAddProduct} className="space-y-4">
          <Input label="ชื่อสินค้า" required autoFocus placeholder="เช่น คีย์บอร์ด Mechanical" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} hint="ชื่อที่แสดงในรายงานและตารางทั้งหมด" />
          <Input label="รหัส SKU" required placeholder="เช่น KB-001" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} hint="ต้องไม่ซ้ำกับสินค้าอื่น" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="ราคาทุน (฿)" required type="number" min="0" step="0.01" placeholder="0.00" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} hint="ใช้คำนวณมูลค่าสต็อก" />
            <Input label="ราคาขาย (฿)" type="number" min="0" step="0.01" placeholder="0.00" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} hint="ใช้คำนวณกำไร" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="จำนวนเริ่มต้น" type="number" min="0" value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value })} hint="จำนวนในมือตอนนี้" />
            <Input label="สต็อกขั้นต่ำ" type="number" min="0" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} hint="แจ้งเตือนเมื่อต่ำกว่านี้" />
          </div>
          <Select label="หมวดหมู่" required value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} hint="จัดกลุ่มสินค้าตามประเภท">
            <option value="">เลือกหมวดหมู่…</option>
            {categories.map(c => {
              const count = products.filter(p => p.category?.id === c.id).length;
              return <option key={c.id} value={c.id}>{c.name} ({count} สินค้า)</option>;
            })}
          </Select>
          {categories.length === 0 && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700">ยังไม่มีหมวดหมู่ <button type="button" onClick={() => { setAddProductOpen(false); setTab("products"); setProductView("categories"); }} className="font-semibold underline cursor-pointer">สร้างหมวดหมู่ก่อน</button></p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <Btn type="button" variant="ghost" className="flex-1" onClick={() => setAddProductOpen(false)}>ยกเลิก</Btn>
            <Btn type="submit" loading={loading} className="flex-1" disabled={categories.length === 0}>
              <Plus size={15} />เพิ่มสินค้า
            </Btn>
          </div>
        </form>
      </Modal>

      {/* แก้ไขสินค้า */}
      <Modal open={editModal.open} onClose={() => setEditModal({ open: false, product: null })} title="แก้ไขข้อมูลสินค้า">
        <form onSubmit={handleEditProduct} className="space-y-4">
          <Input label="ชื่อสินค้า" required autoFocus placeholder="เช่น คีย์บอร์ด Mechanical" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
          <Input label="รหัส SKU" required placeholder="เช่น KB-001" value={editForm.sku} onChange={e => setEditForm({ ...editForm, sku: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="ราคาทุน (฿)" required type="number" min="0" step="0.01" value={editForm.costPrice} onChange={e => setEditForm({ ...editForm, costPrice: e.target.value })} />
            <Input label="ราคาขาย (฿)" type="number" min="0" step="0.01" placeholder="ไม่บังคับ" value={editForm.sellingPrice} onChange={e => setEditForm({ ...editForm, sellingPrice: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="หมวดหมู่" required value={editForm.categoryId} onChange={e => setEditForm({ ...editForm, categoryId: e.target.value })}>
              <option value="">เลือกหมวดหมู่…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input label="สต็อกขั้นต่ำ" type="number" min="0" value={editForm.minStock} onChange={e => setEditForm({ ...editForm, minStock: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-1">
            <Btn type="button" variant="ghost" className="flex-1" onClick={() => setEditModal({ open: false, product: null })}>ยกเลิก</Btn>
            <Btn type="submit" loading={saving} className="flex-1"><Pencil size={14} />บันทึก</Btn>
          </div>
        </form>
      </Modal>

      {/* ── Supplier Modal ──────────────────────────────────────────── */}
      <Modal open={supplierModal.open} onClose={() => setSupplierModal({ open: false, supplier: null })} title={supplierModal.supplier ? "แก้ไขผู้จัดจำหน่าย" : "เพิ่มผู้จัดจำหน่าย"}>
        <form onSubmit={handleSaveSupplier} className="space-y-4">
          <Input label="ชื่อบริษัท / ผู้จัดจำหน่าย" required autoFocus value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} />
          <Input label="ชื่อผู้ติดต่อ" value={supplierForm.contactName} onChange={e => setSupplierForm({ ...supplierForm, contactName: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="เบอร์โทร" value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
            <Input label="อีเมล" type="email" value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-1">
            <Btn type="button" variant="ghost" className="flex-1" onClick={() => setSupplierModal({ open: false, supplier: null })}>ยกเลิก</Btn>
            <Btn type="submit" loading={savingSupplier} className="flex-1"><Plus size={14} />{supplierModal.supplier ? "บันทึก" : "เพิ่ม"}</Btn>
          </div>
        </form>
      </Modal>

      {/* ── Import CSV Modal ────────────────────────────────────────── */}
      <Modal open={importOpen} onClose={() => { setImportOpen(false); setImportText(""); setImportParsed(null); }} title="นำเข้าสินค้า (CSV)">
        <div className="space-y-4">
          {!importParsed ? (
            <>
              <p className="text-xs text-slate-500">วางข้อมูล CSV ด้านล่าง หัวตารางต้องมีคอลัมน์: <span className="font-mono bg-slate-100 px-1 rounded">name, sku, costPrice, categoryId</span> (อื่นๆ ไม่บังคับ)</p>
              <button onClick={() => { const t = "name,sku,costPrice,sellingPrice,stockQuantity,minStock,categoryId\n"; const b = new Blob([t], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "import_template.csv"; a.click(); }} className="text-xs text-emerald-600 underline cursor-pointer">ดาวน์โหลด Template CSV</button>
              <textarea rows={8} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none" placeholder={"name,sku,costPrice,sellingPrice,stockQuantity,minStock,categoryId\nKeyboard,KB-999,1500,2200,10,5,<categoryId>"} value={importText} onChange={e => setImportText(e.target.value)} />
              <div className="flex gap-3">
                <Btn type="button" variant="ghost" className="flex-1" onClick={() => setImportOpen(false)}>ยกเลิก</Btn>
                <Btn type="button" className="flex-1" onClick={parseCSV} disabled={!importText.trim()}><Upload size={14} />วิเคราะห์ CSV</Btn>
              </div>
            </>
          ) : (
            <>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-xs text-emerald-700 font-semibold">
                พบ {importParsed.length} รายการ — ตรวจสอบแล้วกด &quot;นำเข้า&quot;
              </div>
              <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-xl">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0"><tr>{["ชื่อ","SKU","ราคาทุน","ราคาขาย","จำนวน"].map(h => <th key={h} className="px-3 py-2 text-left text-slate-500 font-semibold">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {importParsed.slice(0, 10).map((r, i) => <tr key={i} className="hover:bg-slate-50"><td className="px-3 py-1.5">{r.name}</td><td className="px-3 py-1.5 font-mono">{r.sku}</td><td className="px-3 py-1.5">{r.costPrice}</td><td className="px-3 py-1.5">{r.sellingPrice || "—"}</td><td className="px-3 py-1.5">{r.stockQuantity || "0"}</td></tr>)}
                    {importParsed.length > 10 && <tr><td colSpan={5} className="px-3 py-2 text-slate-400 text-center">+{importParsed.length - 10} รายการเพิ่มเติม</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3">
                <Btn type="button" variant="ghost" className="flex-1" onClick={() => setImportParsed(null)}>แก้ไข CSV</Btn>
                <Btn type="button" loading={importing} className="flex-1" onClick={handleImport}><Upload size={14} />นำเข้า {importParsed.length} รายการ</Btn>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ยืนยันการลบ */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="ยืนยันการลบ">
        {deleteConfirm && (
          <div className="space-y-5">
            <div className="flex items-start gap-4 p-4 bg-rose-50 rounded-xl border border-rose-100">
              <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 size={16} className="text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-rose-800">ลบ &ldquo;{deleteConfirm.name}&rdquo;?</p>
                <p className="text-xs text-rose-600 mt-1">
                  {deleteConfirm.type === "product"
                    ? "สินค้านี้จะถูกลบออกถาวร แต่ประวัติการเคลื่อนไหวยังคงอยู่"
                    : "หมวดหมู่นี้จะถูกลบออก ไม่สามารถลบได้หากมีสินค้าอยู่"}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            <div className="flex gap-3">
              <Btn type="button" variant="ghost" className="flex-1" autoFocus onClick={() => setDeleteConfirm(null)}>ไม่ ยกเลิก</Btn>
              <Btn type="button" variant="danger" loading={deleting} className="flex-1" onClick={handleDelete}><Trash2 size={14} />ใช่ ลบเลย</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-40 w-60 shrink-0 bg-slate-900 flex flex-col select-none transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
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
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-slate-300 cursor-pointer"><X size={16} /></button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ id, label, Icon, subs }) => {
            const active = tab === id;
            return (
              <div key={id}>
                <button onClick={() => setTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer text-left group ${
                    active ? "bg-emerald-500/10 text-emerald-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}>
                  <Icon size={16} className="shrink-0" />
                  <span className="flex-1">{label}</span>
                  {id === "products" && lowStock.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                      {lowStock.length}
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
                        <button key={sub.id}
                          onClick={() => {
                            if (id === "products") setProductView(sub.id as typeof productView);
                            else setStockView(sub.id as typeof stockView);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer text-left ${
                            subActive ? "bg-emerald-500/15 text-emerald-300" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
                          }`}>
                          <sub.Icon size={12} className="shrink-0" />
                          <span className="flex-1">{sub.label}</span>
                          {sub.id === "low-stock" && lowStock.length > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400">{lowStock.length}</span>
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

        <div className="px-4 py-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full shrink-0 ${connError ? "bg-rose-500 shadow-rose-500/60" : "bg-emerald-400 shadow-emerald-400/60"} shadow-[0_0_6px]`} />
            <span className="text-[11px] text-slate-500 font-medium">{connError ? "ไม่ได้เชื่อมต่อ" : "เชื่อมต่อ Google Sheets"}</span>
          </div>
<button
            onClick={() => { if (window.confirm("ลบข้อมูลทั้งหมดในชีตแล้วเติมข้อมูลตัวอย่างใหม่?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้")) loadSeedData(); }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold text-rose-500/70 hover:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            <Trash2 size={11} />
            รีเซ็ต &amp; โหลดข้อมูลใหม่
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-4 lg:px-6 py-3.5 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer">
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                {(() => { const n = NAV.find(n => n.id === tab); return n ? <n.Icon size={15} className="text-slate-400" /> : null; })()}
                {NAV.find(n => n.id === tab)?.label}
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                {new Date().toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Bangkok" })}
              </p>
            </div>
          </div>
          <button onClick={fetchAll} disabled={loading}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl px-3.5 py-2 transition-all disabled:opacity-50 cursor-pointer">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

          {connError && (
            <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 text-sm text-amber-800">
              <Shield size={16} className="text-amber-500 shrink-0" />
              <div><p className="font-semibold">เชื่อมต่อไม่ได้</p><p className="text-xs mt-0.5">{connError}</p></div>
            </div>
          )}

          {/* ═══ DASHBOARD ═══════════════════════════════════════════════ */}
          {tab === "dashboard" && (
            <div className="space-y-5 max-w-7xl">
              {isFirstRun ? (
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
                        { step: "1", label: "สร้างหมวดหมู่", desc: "จัดกลุ่มสินค้าตามประเภท เช่น IT, เฟอร์นิเจอร์", tab: "products" as Tab, view: "categories", Icon: Tag, color: "bg-purple-500" },
                        { step: "2", label: "เพิ่มสินค้า", desc: "ใส่ข้อมูลสินค้า ราคาทุน และจำนวนเริ่มต้น", tab: "products" as Tab, Icon: PackagePlus, color: "bg-blue-500" },
                        { step: "3", label: "ปรับสต็อก", desc: "บันทึกการรับเข้าและจ่ายออกทุกครั้ง", tab: "stock" as Tab, Icon: ArrowLeftRight, color: "bg-emerald-500" },
                      ].map(s => (
                        <button key={s.step} onClick={() => { setTab(s.tab); if ("view" in s && s.view) setProductView(s.view as "categories"); }}
                          className="flex flex-col gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer text-left group">
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
                    <button onClick={loadSeedData} disabled={loading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition-all cursor-pointer border border-white/10">
                      {loading ? <RefreshCw size={12} className="animate-spin" /> : <Package size={12} />}
                      หรือโหลดข้อมูลตัวอย่างเพื่อลองใช้งาน
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard label="สินค้าทั้งหมด" value={products.length} sub={`ใน ${categories.length} หมวดหมู่`} Icon={Package} accent="bg-blue-50 text-blue-500" />
                    <StatCard label="สินค้าใกล้หมด" value={lowStock.length} sub="ต่ำกว่าสต็อกขั้นต่ำ" Icon={AlertTriangle} accent="bg-rose-50 text-rose-500" />
                    <StatCard label="มูลค่าสต็อก (ทุน)" value={`฿${totalValue.toLocaleString("th-TH", { maximumFractionDigits: 0 })}`} sub={totalSellValue > 0 ? `ราคาขาย ฿${totalSellValue.toLocaleString("th-TH", { maximumFractionDigits: 0 })}` : "คำนวณจากราคาทุน"} Icon={DollarSign} accent="bg-emerald-50 text-emerald-600" />
                    <StatCard label="กิจกรรมวันนี้" value={todayTx} sub={`รวม ${transactions.length} รายการ`} Icon={Activity} accent="bg-purple-50 text-purple-500" />
                  </div>

                  {/* ── Profit summary bar ─────────────────────────────── */}
                  {totalSellValue > 0 && (() => {
                    const profit = totalSellValue - totalValue;
                    const margin = totalValue > 0 ? Math.round((profit / totalSellValue) * 100) : 0;
                    const costPct = Math.round((totalValue / totalSellValue) * 100);
                    return (
                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-bold text-slate-800">กำไรรวมในสต็อก</p>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${margin >= 20 ? "bg-emerald-50 text-emerald-600" : margin >= 0 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-500"}`}>
                            margin {margin}%
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="relative h-5 bg-slate-100 rounded-full overflow-hidden mb-3">
                          <div className="absolute inset-y-0 left-0 bg-slate-400 rounded-l-full transition-all duration-700" style={{ width: `${costPct}%` }} />
                          <div className="absolute inset-y-0 bg-emerald-400 rounded-r-full transition-all duration-700" style={{ left: `${costPct}%`, right: 0 }} />
                        </div>
                        {/* 3 numbers */}
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-[11px] text-slate-400 font-medium mb-0.5">ต้นทุนรวม</p>
                            <p className="text-sm font-bold font-mono text-slate-700">฿{totalValue.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</p>
                          </div>
                          <div className="border-x border-slate-100">
                            <p className="text-[11px] text-slate-400 font-medium mb-0.5">ราคาขายรวม</p>
                            <p className="text-sm font-bold font-mono text-slate-800">฿{totalSellValue.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-400 font-medium mb-0.5">กำไรรวม</p>
                            <p className={`text-sm font-bold font-mono ${profit >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                              {profit >= 0 ? "+" : ""}฿{profit.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                    <div className="xl:col-span-3 space-y-5">
                      {/* Stock levels */}
                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-5">
                          <div>
                            <h3 className="text-sm font-bold text-slate-800">ระดับสต็อกสินค้า</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">ภาพรวมสินค้าทั้งหมด</p>
                          </div>
                        </div>
                        {loading ? (
                          <div className="space-y-3.5">{[...Array(5)].map((_, i) => <div key={i} className="flex items-center gap-3"><Skeleton className="w-32 h-8 shrink-0" /><Skeleton className="flex-1 h-2 rounded-full" /><Skeleton className="w-8 h-4" /></div>)}</div>
                        ) : (
                          <div className="space-y-3.5">
                            {(showAllStock ? products : products.slice(0, 9)).map(p => <StockBar key={p.id} name={p.name} sku={p.sku} stock={p.stockQuantity} max={maxStock} />)}
                            {products.length > 9 && (
                              <button onClick={() => setShowAllStock(v => !v)} className="text-xs text-slate-400 hover:text-emerald-500 text-center pt-1 w-full cursor-pointer transition-colors">
                                {showAllStock ? "▲ แสดงน้อยลง" : `+${products.length - 9} สินค้าเพิ่มเติม ▼`}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Category stock value chart */}
                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <BarChart3 size={15} className="text-slate-400" />
                          <h3 className="text-sm font-bold text-slate-800">มูลค่าสต็อกตามหมวดหมู่</h3>
                        </div>
                        {loading ? (
                          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="flex items-center gap-3"><Skeleton className="w-24 h-4 shrink-0" /><Skeleton className="flex-1 h-3 rounded-full" /><Skeleton className="w-16 h-4" /></div>)}</div>
                        ) : catChartData.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4">ยังไม่มีข้อมูล</p>
                        ) : (
                          <div className="space-y-3">
                            {catChartData.map((cat, i) => {
                              const colors = ["bg-blue-500","bg-emerald-500","bg-purple-500","bg-amber-500","bg-rose-500"];
                              return (
                                <div key={i} className="flex items-center gap-3 group">
                                  <div className="w-28 shrink-0">
                                    <p className="text-xs font-semibold text-slate-700 truncate">{cat.name}</p>
                                    <p className="text-[10px] text-slate-400">{cat.count} สินค้า</p>
                                  </div>
                                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-700 ${colors[i % colors.length]}`} style={{ width: `${cat.pct}%` }} />
                                  </div>
                                  <span className="w-24 text-right text-xs font-bold font-mono text-slate-600 shrink-0">฿{cat.value.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">กิจกรรมล่าสุด</h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">การเคลื่อนไหวสต็อก</p>
                        </div>
                        <button onClick={() => { setTab("stock"); setStockView("history"); }} className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer">
                          ดูทั้งหมด <ChevronRight size={12} />
                        </button>
                      </div>
                      {loading ? (
                        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="flex items-center gap-3 py-2"><Skeleton className="w-7 h-7 rounded-lg shrink-0" /><div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-32" /><Skeleton className="h-2.5 w-24" /></div><Skeleton className="w-8 h-4" /></div>)}</div>
                      ) : transactions.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">ยังไม่มีรายการ</div>
                      ) : (
                        <div className="space-y-1 flex-1">
                          {[...transactions].reverse().slice(0, 7).map(t => (
                            <div key={t.id} className="flex items-center gap-3 py-2 rounded-xl hover:bg-slate-50 px-2 -mx-2 transition-colors">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${t.type === "IN" ? "bg-emerald-50" : "bg-rose-50"}`}>
                                {t.type === "IN" ? <ArrowUpRight size={13} className="text-emerald-600" /> : <ArrowDownRight size={13} className="text-rose-600" />}
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

                  {lowStock.length > 0 && (
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
                      <div className="flex items-center gap-2.5 mb-3">
                        <AlertTriangle size={15} className="text-rose-500 shrink-0" />
                        <p className="text-sm font-bold text-rose-800">{lowStock.length} รายการต้องเติมสต็อก</p>
                        <button onClick={() => { setTab("stock"); setStockView("adjust"); }} className="ml-auto text-xs font-semibold text-rose-600 hover:text-rose-800 underline underline-offset-2 cursor-pointer">เติมสต็อกเลย</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {lowStock.map(p => (
                          <button key={p.id} onClick={() => goAdjust(p.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer hover:scale-105 transition-transform ${
                              p.stockQuantity === 0 ? "bg-slate-800 text-white border-slate-700" : "bg-white text-rose-700 border-rose-200"
                            }`}>
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

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "เพิ่มสินค้า", Icon: PackagePlus, onClick: () => setAddProductOpen(true), cls: "bg-blue-600 hover:bg-blue-700" },
                      { label: "ปรับสต็อก", Icon: ArrowLeftRight, onClick: () => { setTab("stock"); setStockView("adjust"); }, cls: "bg-emerald-600 hover:bg-emerald-700" },
                      { label: "เพิ่มหมวดหมู่", Icon: Tag, onClick: () => { setTab("products"); setProductView("categories"); }, cls: "bg-purple-600 hover:bg-purple-700" },
                    ].map((a, i) => (
                      <button key={i} onClick={a.onClick}
                        className={`flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-[0.98] cursor-pointer shadow-sm ${a.cls}`}>
                        <a.Icon size={16} />{a.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ PRODUCTS (รวม: รายการ + ใกล้หมด) ══════════════════════ */}
          {tab === "products" && (
            <div className="space-y-4 max-w-7xl">
              {/* Header row */}
              {productView !== "categories" && (
                <div className="flex items-center justify-end">
                  <Btn onClick={() => setAddProductOpen(true)}>
                    <Plus size={15} />เพิ่มสินค้า
                  </Btn>
                </div>
              )}

              {/* ─── All products ─── */}
              {productView === "all" && (
                <>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input type="text" placeholder="ค้นหาชื่อ, รหัส SKU หรือหมวดหมู่…"
                        value={search} onChange={e => { setSearch(e.target.value); setProductPage(0); }}
                        className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all" />
                      {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"><X size={14} /></button>}
                    </div>
                    <button onClick={() => setImportOpen(true)} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                      <Upload size={14} />นำเข้า
                    </button>
                    <button onClick={() => exportCSV("/api/products/export", "products.csv")} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                      <Download size={14} />Export
                    </button>
                  </div>
                  {search && <p className="text-xs text-slate-500 px-1">{filteredProducts.length === 0 ? `ไม่พบผลลัพธ์สำหรับ "${search}"` : `พบ ${filteredProducts.length} จาก ${products.length} รายการ`}</p>}

                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-slate-800">รายการสินค้า</h2>
                      <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">{sortedProducts.length} รายการ</span>
                    </div>
                    {loading ? (
                      <div className="overflow-x-auto"><table className="w-full"><tbody><TableSkeleton cols={9} /></tbody></table></div>
                    ) : sortedProducts.length === 0 ? (
                      search
                        ? <EmptyState icon={Search} title={`ไม่พบ "${search}"`} desc="ลองค้นหาด้วยชื่อ, SKU หรือหมวดหมู่อื่น" action={{ label: "ล้างการค้นหา", onClick: () => setSearch("") }} />
                        : <EmptyState icon={Package} title="ยังไม่มีสินค้า" desc="เริ่มต้นโดยการเพิ่มสินค้าชิ้นแรก" action={{ label: "เพิ่มสินค้าแรก", onClick: () => setAddProductOpen(true) }} />
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-white z-10">
                              <tr className="border-b border-slate-100">
                                {[
                                  { key: "name", label: "ชื่อสินค้า", align: "left" },
                                  { key: "sku", label: "SKU", align: "left" },
                                  { key: "category", label: "หมวดหมู่", align: "left" },
                                  { key: "costPrice", label: "ราคา / กำไร", align: "right" },
                                  { key: "stockQuantity", label: "จำนวน", align: "center" },
                                  { key: "minStock", label: "ขั้นต่ำ", align: "center" },
                                  { key: "status", label: "สถานะ", align: "center" },
                                  { key: "actions", label: "จัดการ", align: "center" },
                                ].map(col => (
                                  <th key={col.key}
                                    className={`px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"} ${col.key !== "status" && col.key !== "actions" ? "cursor-pointer hover:text-slate-600 select-none" : ""}`}
                                    onClick={() => col.key !== "status" && col.key !== "actions" && toggleProductSort(col.key)}>
                                    {col.label}
                                    {col.key !== "status" && col.key !== "actions" && <SortIcon col={col.key} active={productSort.col} dir={productSort.dir} />}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {pagedProducts.map(p => {
                                const margin = p.sellingPrice && p.costPrice > 0 ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100) : null;
                                return (
                                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                                    <td className="px-4 py-3 font-semibold text-slate-800 max-w-[160px] truncate">{p.name}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.sku}</td>
                                    <td className="px-4 py-3">
                                      {p.category ? <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg text-[11px] font-semibold">{p.category.name}</span> : <span className="text-slate-400">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <p className="font-mono text-xs font-semibold text-slate-700">฿{p.costPrice.toLocaleString("th-TH")}</p>
                                      {p.sellingPrice != null ? (
                                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                          <p className="font-mono text-xs text-emerald-600">฿{p.sellingPrice.toLocaleString("th-TH")}</p>
                                          {margin != null && (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${margin >= 20 ? "bg-emerald-50 text-emerald-600" : margin >= 0 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-500"}`}>
                                              {margin}%
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <p className="text-[11px] text-slate-300 mt-0.5">ไม่มีราคาขาย</p>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <button onClick={() => handleQuickAdjust(p.id, -1)} title="-1" className="w-5 h-5 rounded flex items-center justify-center text-rose-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer text-xs font-bold transition-colors">−</button>
                                        <span className={`w-10 text-center font-mono font-bold text-xs ${p.stockQuantity === 0 ? "text-slate-400" : p.stockQuantity <= p.minStock ? "text-rose-600" : "text-slate-800"}`}>{p.stockQuantity}</span>
                                        <button onClick={() => handleQuickAdjust(p.id, 1)} title="+1" className="w-5 h-5 rounded flex items-center justify-center text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer text-xs font-bold transition-colors">+</button>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-center font-mono text-xs text-slate-400">{p.minStock}</td>
                                    <td className="px-4 py-3 text-center"><StockBadge qty={p.stockQuantity} min={p.minStock} /></td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center justify-center gap-1">
                                        <button onClick={() => goAdjust(p.id)} title="ปรับสต็อก" className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer"><ArrowLeftRight size={12} /></button>
                                        <button onClick={() => openEdit(p)} title="แก้ไข" className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"><Pencil size={12} /></button>
                                        <button onClick={() => setDeleteConfirm({ type: "product", id: p.id, name: p.name })} title="ลบ" className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"><Trash2 size={12} /></button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        {productPageCount > 1 && (
                          <div className="px-6 py-3 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-xs text-slate-400">หน้า {productPage + 1} / {productPageCount} ({sortedProducts.length} รายการ)</span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => setProductPage(0)} disabled={productPage === 0} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-default"><ChevronsLeft size={13} /></button>
                              <button onClick={() => setProductPage(p => p - 1)} disabled={productPage === 0} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-default"><ChevronLeft size={13} /></button>
                              <button onClick={() => setProductPage(p => p + 1)} disabled={productPage >= productPageCount - 1} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-default"><ChevronRight size={13} /></button>
                              <button onClick={() => setProductPage(productPageCount - 1)} disabled={productPage >= productPageCount - 1} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-default"><ChevronsRight size={13} /></button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}

              {/* ─── Low stock ─── */}
              {productView === "low-stock" && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-800">สินค้าใกล้หมด / หมดสต็อก</h2>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">{lowStock.length} รายการ</span>
                  </div>
                  {loading ? (
                    <div className="overflow-x-auto"><table className="w-full"><tbody><TableSkeleton cols={7} /></tbody></table></div>
                  ) : lowStock.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3"><CheckCircle2 size={24} className="text-emerald-500" /></div>
                      <p className="text-slate-700 font-semibold text-sm">สินค้าทุกรายการมีเพียงพอ</p>
                      <p className="text-slate-400 text-xs mt-1">สินค้าทุกชิ้นมีจำนวนเกินกว่าสต็อกขั้นต่ำ</p>
                    </div>
                  ) : (
                    <>
                      <div className="px-6 py-3 bg-rose-50 border-b border-rose-100 flex items-center gap-2 text-xs text-rose-700">
                        <AlertTriangle size={13} className="shrink-0" />
                        <span>มี <strong>{lowStock.length}</strong> รายการที่ต้องเติมสต็อก — สีแดง = ต่ำกว่าขั้นต่ำที่กำหนดไว้ต่อสินค้า</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b border-slate-100">
                            {["ชื่อสินค้า", "SKU", "หมวดหมู่", "มีในสต็อก", "ขั้นต่ำ", "สถานะ", ""].map(h => (
                              <th key={h} className={`px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider ${["มีในสต็อก","ขั้นต่ำ","สถานะ",""].includes(h) ? "text-center" : ""}`}>{h}</th>
                            ))}
                          </tr></thead>
                          <tbody className="divide-y divide-slate-50">
                            {lowStock.map(p => (
                              <tr key={p.id} className="hover:bg-rose-50/30 transition-colors">
                                <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                                <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.sku}</td>
                                <td className="px-4 py-3 text-slate-500 text-xs">{p.category?.name ?? "—"}</td>
                                <td className="px-4 py-3 text-center font-mono font-bold text-rose-600">{p.stockQuantity}</td>
                                <td className="px-4 py-3 text-center font-mono text-xs text-slate-400">{p.minStock}</td>
                                <td className="px-4 py-3 text-center"><StockBadge qty={p.stockQuantity} min={p.minStock} /></td>
                                <td className="px-4 py-3 text-center">
                                  <button onClick={() => goAdjust(p.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer">
                                    <ArrowLeftRight size={11} />เติมสต็อก
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ─── Categories ─── */}
              {productView === "categories" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* ฟอร์มเพิ่มหมวดหมู่ */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">เพิ่มหมวดหมู่ใหม่</h2>
                      <p className="text-xs text-slate-400 mt-0.5">หลังสร้างหมวดหมู่แล้ว กลับไปแท็บ &ldquo;สินค้าทั้งหมด&rdquo; เพื่อเพิ่มสินค้าได้เลย</p>
                    </div>
                    <form onSubmit={handleAddCat} className="space-y-4">
                      <Input label="ชื่อหมวดหมู่" required autoFocus placeholder="เช่น IT, เครื่องใช้สำนักงาน, เฟอร์นิเจอร์" value={cat.name} onChange={e => setCat({ ...cat, name: e.target.value })} hint="ชื่อสั้น กระชับ — จะแสดงในดรอปดาวน์สินค้า" />
                      <Input label="คำอธิบาย" placeholder="ไม่บังคับ" value={cat.description} onChange={e => setCat({ ...cat, description: e.target.value })} hint="อธิบายสินค้าในกลุ่มนี้" />
                      <Btn type="submit" loading={loading} className="w-full"><Plus size={15} />สร้างหมวดหมู่</Btn>
                      <button type="button" onClick={() => { setProductView("all"); setAddProductOpen(true); }}
                        className="w-full text-xs text-slate-500 hover:text-emerald-600 underline underline-offset-2 cursor-pointer transition-colors text-center">
                        มีหมวดหมู่แล้ว → ไปเพิ่มสินค้าเลย
                      </button>
                    </form>
                  </div>

                  {/* รายการหมวดหมู่ */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                      <h2 className="text-sm font-bold text-slate-800">หมวดหมู่ทั้งหมด</h2>
                      <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">{categories.length}</span>
                    </div>
                    {loading ? (
                      <div className="divide-y divide-slate-50">{[...Array(3)].map((_, i) => <div key={i} className="px-5 py-4 flex items-center gap-3"><Skeleton className="w-7 h-7 rounded-lg shrink-0" /><div className="space-y-1.5 flex-1"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-3 w-36" /></div></div>)}</div>
                    ) : categories.length === 0 ? (
                      <EmptyState icon={Tag} title="ยังไม่มีหมวดหมู่" desc="สร้างหมวดหมู่แรกจากฟอร์มด้านซ้าย" />
                    ) : (
                      <ul className="divide-y divide-slate-50">
                        {categories.map(c => {
                          const count = products.filter(p => p.category?.id === c.id).length;
                          return (
                            <li key={c.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50/60 transition-colors group">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                                <Tag size={12} className="text-indigo-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                                {c.description && <p className="text-[11px] text-slate-400 mt-0.5">{c.description}</p>}
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {count === 0 ? "ไม่มีสินค้า" : `${count} สินค้า`}
                                  {count > 0 && <span className="text-slate-300"> · ลบไม่ได้จนกว่าจะย้ายสินค้าออก</span>}
                                </p>
                              </div>
                              <button
                                onClick={() => count > 0
                                  ? showToast(`ย้ายสินค้า ${count} รายการออกก่อน จึงจะลบหมวดหมู่ได้`, "error")
                                  : setDeleteConfirm({ type: "category", id: c.id, name: c.name })}
                                title={count > 0 ? `มีสินค้า ${count} รายการ` : "ลบหมวดหมู่"}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 ${
                                  count > 0 ? "text-slate-200 cursor-not-allowed" : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                }`}>
                                <Trash2 size={13} />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ STOCK (รวม: ปรับสต็อก + ประวัติ) ══════════════════════ */}
          {tab === "stock" && (
            <div className="space-y-4 max-w-7xl">
              {/* ─── Adjust ─── */}
              {stockView === "adjust" && (
                <div className="max-w-lg">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">ปรับจำนวนสต็อก</h2>
                      <p className="text-xs text-slate-400 mt-0.5">ทุกการปรับจะถูกบันทึกเป็นประวัติเพื่อตรวจสอบย้อนหลัง</p>
                    </div>
                    <form onSubmit={handleAdjust} className="space-y-4">
                      <ProductPicker products={products} value={adj.productId} onChange={id => setAdj(prev => ({ ...prev, productId: id }))} />

                      {/* IN / OUT toggle */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ประเภท <span className="text-rose-500">*</span></span>
                        <div className="grid grid-cols-2 gap-2">
                          <button type="button" onClick={() => setAdjType("IN")}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer ${
                              adjType === "IN" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                            }`}>
                            <TrendingUp size={15} />รับเข้า
                          </button>
                          <button type="button" onClick={() => setAdjType("OUT")}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer ${
                              adjType === "OUT" ? "border-rose-400 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                            }`}>
                            <TrendingDown size={15} />จ่ายออก
                          </button>
                        </div>
                      </div>

                      <Input label="จำนวน" required type="number" min="1"
                        placeholder="เช่น 10, 50, 100"
                        value={adj.adjustment}
                        onChange={e => setAdj({ ...adj, adjustment: e.target.value })}
                        hint={adjType === "IN" ? "จำนวนที่รับเข้าสต็อก" : "จำนวนที่นำออกจากสต็อก"} />

                      {/* Reason with quick presets */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">เหตุผล / หมายเหตุ <span className="text-rose-500">*</span></span>
                        <div className="flex flex-wrap gap-1.5">
                          {(adjType === "IN"
                            ? ["รับจากซัพพลายเออร์", "รับคืนจากลูกค้า", "ปรับยอดเพิ่ม"]
                            : ["ขายให้ลูกค้า", "สินค้าเสียหาย", "ใช้ภายใน", "ปรับยอดลด"]
                          ).map(preset => (
                            <button key={preset} type="button" onClick={() => setAdj({ ...adj, reason: preset })}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                                adj.reason === preset ? "bg-slate-800 text-white border-slate-700" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                              }`}>
                              {preset}
                            </button>
                          ))}
                        </div>
                        <input required placeholder="หรือพิมพ์เหตุผลเอง…"
                          value={adj.reason} onChange={e => setAdj({ ...adj, reason: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all" />
                      </div>

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
                              <p className={`text-xl font-bold font-mono ${
                                adjProduct.stockQuantity + adjNum < 0 ? "text-rose-500" :
                                adjProduct.stockQuantity + adjNum < 5 ? "text-amber-600" : "text-emerald-600"
                              }`}>
                                {adjProduct.stockQuantity + adjNum < 0
                                  ? <span className="text-sm">ไม่สามารถต่ำกว่า 0</span>
                                  : adjProduct.stockQuantity + adjNum}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <Btn type="submit" loading={loading} className="w-full" disabled={!adj.productId}>
                        <ArrowLeftRight size={15} />บันทึกการปรับสต็อก
                      </Btn>
                    </form>
                  </div>
                </div>
              )}

              {/* ─── History ─── */}
              {stockView === "history" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                      {(["ALL", "IN", "OUT"] as const).map(type => (
                        <button key={type} onClick={() => { setTxFilter(f => ({ ...f, type })); setTxPage(0); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            txFilter.type === type
                              ? type === "IN" ? "bg-emerald-500 text-white shadow-sm" : type === "OUT" ? "bg-rose-500 text-white shadow-sm" : "bg-slate-800 text-white shadow-sm"
                              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                          }`}>
                          {type === "ALL" ? "ทั้งหมด" : type === "IN" ? "รับเข้า" : "จ่ายออก"}
                        </button>
                      ))}
                    </div>
                    <div className="relative flex-1 min-w-40">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input type="text" placeholder="กรองตามชื่อสินค้า…"
                        value={txFilter.product} onChange={e => { setTxFilter(f => ({ ...f, product: e.target.value })); setTxPage(0); }}
                        className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all" />
                      {txFilter.product && <button onClick={() => setTxFilter(f => ({ ...f, product: "" }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"><X size={12} /></button>}
                    </div>
                    <button onClick={() => exportCSV("/api/transactions/export", "transactions.csv")} className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                      <Download size={13} />Export CSV
                    </button>
                    {(txFilter.type !== "ALL" || txFilter.product) && <p className="text-xs text-slate-500">{filteredTx.length} รายการ</p>}
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
                        action={{ label: "บันทึกการปรับสต็อก", onClick: () => setStockView("adjust") }} />
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-white z-10">
                              <tr className="border-b border-slate-100">
                                {[
                                  { key: "createdAt", label: "วันที่ / เวลา" },
                                  { key: "productName", label: "สินค้า" },
                                  { key: "type", label: "ประเภท" },
                                  { key: "quantity", label: "จำนวน" },
                                  { key: "reason", label: "เหตุผล" },
                                ].map(col => (
                                  <th key={col.key}
                                    onClick={() => col.key !== "reason" && toggleTxSort(col.key)}
                                    className={`px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider ${col.key === "type" || col.key === "quantity" ? "text-center" : ""} ${col.key !== "reason" ? "cursor-pointer hover:text-slate-600 select-none" : ""}`}>
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
                                    <p className="text-xs font-medium text-slate-600">{new Date(t.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" })}</p>
                                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{new Date(t.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Bangkok" })}</p>
                                  </td>
                                  <td className="px-5 py-3.5 font-semibold text-slate-800">{t.productName}</td>
                                  <td className="px-5 py-3.5 text-center">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${t.type === "IN" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                      {t.type === "IN" ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
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
                          <div className="px-6 py-3 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-xs text-slate-400">หน้า {txPage + 1} / {txPageCount} ({filteredTx.length} รายการ)</span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => setTxPage(0)} disabled={txPage === 0} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-default"><ChevronsLeft size={13} /></button>
                              <button onClick={() => setTxPage(p => p - 1)} disabled={txPage === 0} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-default"><ChevronLeft size={13} /></button>
                              <button onClick={() => setTxPage(p => p + 1)} disabled={txPage >= txPageCount - 1} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-default"><ChevronRight size={13} /></button>
                              <button onClick={() => setTxPage(txPageCount - 1)} disabled={txPage >= txPageCount - 1} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-default"><ChevronsRight size={13} /></button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ SUPPLIERS ═══════════════════════════════════════════════ */}
          {tab === "suppliers" && (
            <div className="space-y-4 max-w-7xl">
              <div className="flex items-center justify-end">
                <Btn onClick={() => { setSupplierForm({ name: "", contactName: "", phone: "", email: "" }); setSupplierModal({ open: true, supplier: null }); }}>
                  <Plus size={15} />เพิ่มผู้จัดจำหน่าย
                </Btn>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-800">รายชื่อผู้จัดจำหน่าย</h2>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">{suppliers.length} ราย</span>
                </div>
                {loading ? (
                  <div className="divide-y divide-slate-50">{[...Array(3)].map((_, i) => <div key={i} className="px-6 py-4 flex items-center gap-4"><Skeleton className="w-10 h-10 rounded-xl shrink-0" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /></div></div>)}</div>
                ) : suppliers.length === 0 ? (
                  <EmptyState icon={Truck} title="ยังไม่มีผู้จัดจำหน่าย" desc="เพิ่มผู้จัดจำหน่ายเพื่อติดตามแหล่งที่มาของสินค้า"
                    action={{ label: "เพิ่มผู้จัดจำหน่ายแรก", onClick: () => { setSupplierForm({ name: "", contactName: "", phone: "", email: "" }); setSupplierModal({ open: true, supplier: null }); } }} />
                ) : (
                  <div className="divide-y divide-slate-50">
                    {suppliers.map(s => (
                      <div key={s.id} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50/60 transition-colors group">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                          <Truck size={16} className="text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1">
                            {s.contactName && <p className="text-xs text-slate-500">{s.contactName}</p>}
                            {s.phone && <p className="text-xs text-slate-400 font-mono">{s.phone}</p>}
                            {s.email && <p className="text-xs text-slate-400">{s.email}</p>}
                          </div>
                          <p className="text-[10px] text-slate-300 mt-1">เพิ่มเมื่อ {new Date(s.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" })}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => openEditSupplier(s)} title="แก้ไข" className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"><Pencil size={13} /></button>
                          <button onClick={() => setDeleteConfirm({ type: "supplier", id: s.id, name: s.name })} title="ลบ" className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
