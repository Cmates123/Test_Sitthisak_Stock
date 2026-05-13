"use client";

import { useState, useMemo } from "react";
import {
  Package, AlertTriangle, Tag, Search, Plus,
  Pencil, Trash2, ArrowLeftRight, AlertCircle,
  CheckCircle2, Download, Upload, X,
} from "lucide-react";
import type { Category, Product, SortDir } from "@/types";
import {
  Input, Select, Btn, StockBadge, SortIcon,
  TableSkeleton, EmptyState, Pagination, Modal,
} from "@/components/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductView = "all" | "low-stock" | "categories";

interface ProductsViewProps {
  products:          Product[];
  categories:        Category[];
  loading:           boolean;
  addProductOpen:    boolean;
  onOpenAddProduct:  () => void;
  onCloseAddProduct: () => void;
  showToast:         (msg: string, type: "success" | "error") => void;
  refresh:           () => Promise<void>;
  onGoAdjust:        (productId: string) => void;
  productView:       ProductView;
  onSetProductView:  (v: ProductView) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProductsView({
  products, categories, loading,
  addProductOpen, onOpenAddProduct, onCloseAddProduct,
  showToast, refresh,
  onGoAdjust, productView, onSetProductView,
}: ProductsViewProps) {

  // ── Add product form
  const [form, setForm] = useState({
    name: "", sku: "", costPrice: "", sellingPrice: "", minStock: "5", stockQuantity: "0", categoryId: "",
  });
  const [adding, setAdding] = useState(false);

  // ── Edit product
  const [editModal, setEditModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [editForm,  setEditForm]  = useState({ name: "", sku: "", costPrice: "", sellingPrice: "", minStock: "5", categoryId: "" });
  const [saving,    setSaving]    = useState(false);

  // ── Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "product" | "category"; id: string; name: string } | null>(null);
  const [deleting,      setDeleting]      = useState(false);

  // ── Import CSV
  const [importOpen,   setImportOpen]   = useState(false);
  const [importText,   setImportText]   = useState("");
  const [importParsed, setImportParsed] = useState<Record<string, string>[] | null>(null);
  const [importing,    setImporting]    = useState(false);

  // ── Add category form
  const [cat, setCat] = useState({ name: "", description: "" });

  // ── Sort & Pagination
  const PAGE = 20;
  const [sort,   setSort]   = useState<{ col: string; dir: SortDir }>({ col: "name", dir: "asc" });
  const [page,   setPage]   = useState(0);
  const [search, setSearch] = useState("");

  // ─── Derived data ──────────────────────────────────────────────────────────

  const lowStock = products.filter(p => p.stockQuantity <= p.minStock);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.category?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const { col, dir } = sort;
    arr.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if      (col === "name")          { av = a.name;                bv = b.name; }
      else if (col === "sku")           { av = a.sku;                 bv = b.sku; }
      else if (col === "costPrice")     { av = a.costPrice;           bv = b.costPrice; }
      else if (col === "sellingPrice")  { av = a.sellingPrice ?? -1;  bv = b.sellingPrice ?? -1; }
      else if (col === "stockQuantity") { av = a.stockQuantity;       bv = b.stockQuantity; }
      else if (col === "minStock")      { av = a.minStock;            bv = b.minStock; }
      else if (col === "category")      { av = a.category?.name ?? ""; bv = b.category?.name ?? ""; }
      if (typeof av === "string") return dir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return dir === "asc" ? av - (bv as number) : (bv as number) - av;
    });
    return arr;
  }, [filtered, sort]);

  const pageCount   = Math.ceil(sorted.length / PAGE);
  const paged       = sorted.slice(page * PAGE, (page + 1) * PAGE);
  const toggleSort  = (col: string) => { setSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" })); setPage(0); };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res  = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:          form.name,
          sku:           form.sku,
          costPrice:     parseFloat(form.costPrice),
          stockQuantity: parseInt(form.stockQuantity),
          categoryId:    form.categoryId,
          sellingPrice:  form.sellingPrice ? parseFloat(form.sellingPrice) : undefined,
          minStock:      parseInt(form.minStock) || 5,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`เพิ่ม "${form.name}" เรียบร้อยแล้ว`, "success");
        setForm({ name: "", sku: "", costPrice: "", sellingPrice: "", minStock: "5", stockQuantity: "0", categoryId: "" });
        onCloseAddProduct();
        refresh();
      } else {
        showToast(json.error, "error");
      }
    } finally {
      setAdding(false);
    }
  };

  const openEdit = (p: Product) => {
    setEditForm({
      name:         p.name,
      sku:          p.sku,
      costPrice:    String(p.costPrice),
      sellingPrice: p.sellingPrice != null ? String(p.sellingPrice) : "",
      minStock:     String(p.minStock),
      categoryId:   p.category?.id ?? "",
    });
    setEditModal({ open: true, product: p });
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.product) return;
    setSaving(true);
    try {
      const res  = await fetch(`/api/products/${editModal.product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:         editForm.name,
          sku:          editForm.sku,
          costPrice:    parseFloat(editForm.costPrice),
          categoryId:   editForm.categoryId,
          sellingPrice: editForm.sellingPrice ? parseFloat(editForm.sellingPrice) : null,
          minStock:     parseInt(editForm.minStock) || 5,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`อัปเดต "${editForm.name}" เรียบร้อย`, "success");
        setEditModal({ open: false, product: null });
        refresh();
      } else {
        showToast(json.error, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const url  = deleteConfirm.type === "product"
        ? `/api/products/${deleteConfirm.id}`
        : `/api/categories/${deleteConfirm.id}`;
      const res  = await fetch(url, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast(`ลบ "${deleteConfirm.name}" แล้ว`, "success");
        setDeleteConfirm(null);
        refresh();
      } else {
        showToast(json.error, "error");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleAddCat = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res  = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cat),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`สร้างหมวดหมู่ "${cat.name}" แล้ว`, "success");
        setCat({ name: "", description: "" });
        refresh();
      } else {
        showToast(json.error, "error");
      }
    } finally {
      setAdding(false);
    }
  };

  const handleQuickAdjust = async (productId: string, delta: number) => {
    const res  = await fetch("/api/stock/adjust", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, adjustment: delta, reason: delta > 0 ? "ปรับเพิ่มด่วน" : "ปรับลดด่วน" }),
    });
    const json = await res.json();
    if (json.success) {
      showToast(`${json.data.name}: ${json.data.previousStock} → ${json.data.newStock}`, "success");
      refresh();
    } else {
      showToast(json.error, "error");
    }
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
    const rows   = lines.slice(1).map(line => {
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
      const res  = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: importParsed }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`นำเข้าสำเร็จ ${json.imported} รายการ, ข้ามไป ${json.skipped} รายการ`, "success");
        setImportOpen(false);
        setImportText("");
        setImportParsed(null);
        refresh();
      } else {
        showToast(json.error, "error");
      }
    } finally {
      setImporting(false);
    }
  };

  const exportCSV = () => {
    const a = document.createElement("a");
    a.href = "/api/products/export";
    a.download = "products.csv";
    a.click();
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Add Product Modal ──────────────────────────────────────────────── */}
      <Modal open={addProductOpen} onClose={onCloseAddProduct} title="เพิ่มสินค้าใหม่">
        <form onSubmit={handleAddProduct} className="space-y-4">
          <Input label="ชื่อสินค้า" required autoFocus placeholder="เช่น คีย์บอร์ด Mechanical"
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            hint="ชื่อที่แสดงในรายงานและตารางทั้งหมด" />
          <Input label="รหัส SKU" required placeholder="เช่น KB-001"
            value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })}
            hint="ต้องไม่ซ้ำกับสินค้าอื่น" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="ราคาทุน (฿)" required type="number" min="0" step="0.01" placeholder="0.00"
              value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })}
              hint="ใช้คำนวณมูลค่าสต็อก" />
            <Input label="ราคาขาย (฿)" type="number" min="0" step="0.01" placeholder="0.00"
              value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })}
              hint="ใช้คำนวณกำไร" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="จำนวนเริ่มต้น" type="number" min="0"
              value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value })}
              hint="จำนวนในมือตอนนี้" />
            <Input label="สต็อกขั้นต่ำ" type="number" min="0"
              value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })}
              hint="แจ้งเตือนเมื่อต่ำกว่านี้" />
          </div>
          <Select label="หมวดหมู่" required value={form.categoryId}
            onChange={e => setForm({ ...form, categoryId: e.target.value })}
            hint="จัดกลุ่มสินค้าตามประเภท">
            <option value="">เลือกหมวดหมู่…</option>
            {categories.map(c => {
              const count = products.filter(p => p.category?.id === c.id).length;
              return <option key={c.id} value={c.id}>{c.name} ({count} สินค้า)</option>;
            })}
          </Select>
          {categories.length === 0 && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700">
                ยังไม่มีหมวดหมู่{" "}
                <button type="button" className="font-semibold underline cursor-pointer"
                  onClick={() => { onCloseAddProduct(); onSetProductView("categories"); }}>
                  สร้างหมวดหมู่ก่อน
                </button>
              </p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <Btn type="button" variant="ghost" className="flex-1" onClick={onCloseAddProduct}>ยกเลิก</Btn>
            <Btn type="submit" loading={adding} className="flex-1" disabled={categories.length === 0}>
              <Plus size={15} />เพิ่มสินค้า
            </Btn>
          </div>
        </form>
      </Modal>

      {/* ── Edit Product Modal ─────────────────────────────────────────────── */}
      <Modal open={editModal.open} onClose={() => setEditModal({ open: false, product: null })} title="แก้ไขข้อมูลสินค้า">
        <form onSubmit={handleEditProduct} className="space-y-4">
          <Input label="ชื่อสินค้า" required autoFocus
            value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
          <Input label="รหัส SKU" required
            value={editForm.sku} onChange={e => setEditForm({ ...editForm, sku: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="ราคาทุน (฿)" required type="number" min="0" step="0.01"
              value={editForm.costPrice} onChange={e => setEditForm({ ...editForm, costPrice: e.target.value })} />
            <Input label="ราคาขาย (฿)" type="number" min="0" step="0.01" placeholder="ไม่บังคับ"
              value={editForm.sellingPrice} onChange={e => setEditForm({ ...editForm, sellingPrice: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="หมวดหมู่" required value={editForm.categoryId}
              onChange={e => setEditForm({ ...editForm, categoryId: e.target.value })}>
              <option value="">เลือกหมวดหมู่…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input label="สต็อกขั้นต่ำ" type="number" min="0"
              value={editForm.minStock} onChange={e => setEditForm({ ...editForm, minStock: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-1">
            <Btn type="button" variant="ghost" className="flex-1" onClick={() => setEditModal({ open: false, product: null })}>ยกเลิก</Btn>
            <Btn type="submit" loading={saving} className="flex-1"><Pencil size={14} />บันทึก</Btn>
          </div>
        </form>
      </Modal>

      {/* ── Import CSV Modal ───────────────────────────────────────────────── */}
      <Modal
        open={importOpen}
        onClose={() => { setImportOpen(false); setImportText(""); setImportParsed(null); }}
        title="นำเข้าสินค้า (CSV)"
      >
        <div className="space-y-4">
          {!importParsed ? (
            <>
              <p className="text-xs text-slate-500">
                วางข้อมูล CSV ด้านล่าง หัวตารางต้องมีคอลัมน์:{" "}
                <span className="font-mono bg-slate-100 px-1 rounded">name, sku, costPrice, categoryId</span>{" "}
                (อื่นๆ ไม่บังคับ)
              </p>
              <button
                className="text-xs text-emerald-600 underline cursor-pointer"
                onClick={() => {
                  const t = "name,sku,costPrice,sellingPrice,stockQuantity,minStock,categoryId\n";
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(new Blob([t], { type: "text/csv" }));
                  a.download = "import_template.csv";
                  a.click();
                }}
              >
                ดาวน์โหลด Template CSV
              </button>
              <textarea
                rows={8}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono
                  placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30
                  focus:border-emerald-500 resize-none"
                placeholder={"name,sku,costPrice,sellingPrice,stockQuantity,minStock,categoryId\nKeyboard,KB-999,1500,2200,10,5,<categoryId>"}
                value={importText}
                onChange={e => setImportText(e.target.value)}
              />
              <div className="flex gap-3">
                <Btn type="button" variant="ghost" className="flex-1" onClick={() => setImportOpen(false)}>ยกเลิก</Btn>
                <Btn type="button" className="flex-1" onClick={parseCSV} disabled={!importText.trim()}>
                  <Upload size={14} />วิเคราะห์ CSV
                </Btn>
              </div>
            </>
          ) : (
            <>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-xs text-emerald-700 font-semibold">
                พบ {importParsed.length} รายการ — ตรวจสอบแล้วกด &quot;นำเข้า&quot;
              </div>
              <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-xl">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      {["ชื่อ", "SKU", "ราคาทุน", "ราคาขาย", "จำนวน"].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-slate-500 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {importParsed.slice(0, 10).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5">{r.name}</td>
                        <td className="px-3 py-1.5 font-mono">{r.sku}</td>
                        <td className="px-3 py-1.5">{r.costPrice}</td>
                        <td className="px-3 py-1.5">{r.sellingPrice || "—"}</td>
                        <td className="px-3 py-1.5">{r.stockQuantity || "0"}</td>
                      </tr>
                    ))}
                    {importParsed.length > 10 && (
                      <tr><td colSpan={5} className="px-3 py-2 text-slate-400 text-center">+{importParsed.length - 10} รายการเพิ่มเติม</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3">
                <Btn type="button" variant="ghost" className="flex-1" onClick={() => setImportParsed(null)}>แก้ไข CSV</Btn>
                <Btn type="button" loading={importing} className="flex-1" onClick={handleImport}>
                  <Upload size={14} />นำเข้า {importParsed.length} รายการ
                </Btn>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ───────────────────────────────────────────── */}
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
              <Btn type="button" variant="danger" loading={deleting} className="flex-1" onClick={handleDelete}>
                <Trash2 size={14} />ใช่ ลบเลย
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      <div className="space-y-4 max-w-7xl">
        {productView !== "categories" && (
          <div className="flex items-center justify-end">
            <Btn onClick={onOpenAddProduct}>
              <Plus size={15} />เพิ่มสินค้า
            </Btn>
          </div>
        )}

        {/* All Products */}
        {productView === "all" && (
          <>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, รหัส SKU หรือหมวดหมู่…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0); }}
                  className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm
                    placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30
                    focus:border-emerald-500 transition-all"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X size={14} />
                  </button>
                )}
              </div>
              <button onClick={() => setImportOpen(true)} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                <Upload size={14} />นำเข้า
              </button>
              <button onClick={exportCSV} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                <Download size={14} />Export
              </button>
            </div>

            {search && (
              <p className="text-xs text-slate-500 px-1">
                {filtered.length === 0
                  ? `ไม่พบผลลัพธ์สำหรับ "${search}"`
                  : `พบ ${filtered.length} จาก ${products.length} รายการ`}
              </p>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800">รายการสินค้า</h2>
                <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">{sorted.length} รายการ</span>
              </div>
              {loading ? (
                <div className="overflow-x-auto"><table className="w-full"><tbody><TableSkeleton cols={9} /></tbody></table></div>
              ) : sorted.length === 0 ? (
                search
                  ? <EmptyState icon={Search} title={`ไม่พบ "${search}"`} desc="ลองค้นหาด้วยชื่อ, SKU หรือหมวดหมู่อื่น" action={{ label: "ล้างการค้นหา", onClick: () => setSearch("") }} />
                  : <EmptyState icon={Package} title="ยังไม่มีสินค้า" desc="เริ่มต้นโดยการเพิ่มสินค้าชิ้นแรก" action={{ label: "เพิ่มสินค้าแรก", onClick: () => {} }} />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="border-b border-slate-100">
                          {[
                            { key: "name",          label: "ชื่อสินค้า",   align: "left"   },
                            { key: "sku",           label: "SKU",          align: "left"   },
                            { key: "category",      label: "หมวดหมู่",    align: "left"   },
                            { key: "costPrice",     label: "ราคา / กำไร", align: "right"  },
                            { key: "stockQuantity", label: "จำนวน",        align: "center" },
                            { key: "minStock",      label: "ขั้นต่ำ",      align: "center" },
                            { key: "status",        label: "สถานะ",        align: "center" },
                            { key: "actions",       label: "จัดการ",       align: "center" },
                          ].map(col => {
                            const sortable = col.key !== "status" && col.key !== "actions";
                            return (
                              <th
                                key={col.key}
                                onClick={() => sortable && toggleSort(col.key)}
                                className={`px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap
                                  ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                                  ${sortable ? "cursor-pointer hover:text-slate-600 select-none" : ""}`}
                              >
                                {col.label}
                                {sortable && <SortIcon col={col.key} active={sort.col} dir={sort.dir} />}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {paged.map(p => {
                          const margin = p.sellingPrice && p.costPrice > 0
                            ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100)
                            : null;
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                              <td className="px-4 py-3 font-semibold text-slate-800 max-w-[160px] truncate">{p.name}</td>
                              <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.sku}</td>
                              <td className="px-4 py-3">
                                {p.category
                                  ? <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg text-[11px] font-semibold">{p.category.name}</span>
                                  : <span className="text-slate-400">—</span>
                                }
                              </td>
                              <td className="px-4 py-3 text-right">
                                <p className="font-mono text-xs font-semibold text-slate-700">฿{p.costPrice.toLocaleString("th-TH")}</p>
                                {p.sellingPrice != null ? (
                                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                    <p className="font-mono text-xs text-emerald-600">฿{p.sellingPrice.toLocaleString("th-TH")}</p>
                                    {margin != null && (
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                        ${margin >= 20 ? "bg-emerald-50 text-emerald-600" : margin >= 0 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-500"}`}>
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
                                  <button onClick={() => handleQuickAdjust(p.id, -1)} title="-1"
                                    className="w-5 h-5 rounded flex items-center justify-center text-rose-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer text-xs font-bold transition-colors">−</button>
                                  <span className={`w-10 text-center font-mono font-bold text-xs
                                    ${p.stockQuantity === 0 ? "text-slate-400" : p.stockQuantity <= p.minStock ? "text-rose-600" : "text-slate-800"}`}>
                                    {p.stockQuantity}
                                  </span>
                                  <button onClick={() => handleQuickAdjust(p.id, 1)} title="+1"
                                    className="w-5 h-5 rounded flex items-center justify-center text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer text-xs font-bold transition-colors">+</button>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-xs text-slate-400">{p.minStock}</td>
                              <td className="px-4 py-3 text-center"><StockBadge qty={p.stockQuantity} min={p.minStock} /></td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={() => onGoAdjust(p.id)} title="ปรับสต็อก"
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer"><ArrowLeftRight size={12} /></button>
                                  <button onClick={() => openEdit(p)} title="แก้ไข"
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"><Pencil size={12} /></button>
                                  <button onClick={() => setDeleteConfirm({ type: "product", id: p.id, name: p.name })} title="ลบ"
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"><Trash2 size={12} /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {pageCount > 1 && (
                    <Pagination page={page} pageCount={pageCount} total={sorted.length} onChange={setPage} />
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* Low Stock */}
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
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={24} className="text-emerald-500" />
                </div>
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
                    <thead>
                      <tr className="border-b border-slate-100">
                        {["ชื่อสินค้า", "SKU", "หมวดหมู่", "มีในสต็อก", "ขั้นต่ำ", "สถานะ", ""].map(h => (
                          <th key={h} className={`px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider
                            ${["มีในสต็อก", "ขั้นต่ำ", "สถานะ", ""].includes(h) ? "text-center" : ""}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
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
                            <button
                              onClick={() => onGoAdjust(p.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
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

        {/* Categories */}
        {productView === "categories" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800">เพิ่มหมวดหมู่ใหม่</h2>
                <p className="text-xs text-slate-400 mt-0.5">หลังสร้างหมวดหมู่แล้ว กลับไปแท็บ &ldquo;สินค้าทั้งหมด&rdquo; เพื่อเพิ่มสินค้าได้เลย</p>
              </div>
              <form onSubmit={handleAddCat} className="space-y-4">
                <Input label="ชื่อหมวดหมู่" required autoFocus placeholder="เช่น IT, เครื่องใช้สำนักงาน"
                  value={cat.name} onChange={e => setCat({ ...cat, name: e.target.value })}
                  hint="ชื่อสั้น กระชับ — จะแสดงในดรอปดาวน์สินค้า" />
                <Input label="คำอธิบาย" placeholder="ไม่บังคับ"
                  value={cat.description} onChange={e => setCat({ ...cat, description: e.target.value })}
                  hint="อธิบายสินค้าในกลุ่มนี้" />
                <Btn type="submit" loading={adding} className="w-full"><Plus size={15} />สร้างหมวดหมู่</Btn>
                <button
                  type="button"
                  onClick={() => { onSetProductView("all"); }}
                  className="w-full text-xs text-slate-500 hover:text-emerald-600 underline underline-offset-2 cursor-pointer transition-colors text-center"
                >
                  มีหมวดหมู่แล้ว → ไปเพิ่มสินค้าเลย
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">หมวดหมู่ทั้งหมด</h2>
                <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">{categories.length}</span>
              </div>
              {loading ? (
                <div className="divide-y divide-slate-50">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="px-5 py-4 flex items-center gap-3">
                      <div className="w-7 h-7 bg-slate-100 rounded-lg animate-pulse shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 w-24 bg-slate-100 rounded animate-pulse" />
                        <div className="h-3 w-36 bg-slate-100 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
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
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5 opacity-0 group-hover:opacity-100
                            ${count > 0 ? "text-slate-200 cursor-not-allowed" : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"}`}
                        >
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
    </>
  );
}
