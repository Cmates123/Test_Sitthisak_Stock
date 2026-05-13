"use client";

import { useState } from "react";
import { Truck, Pencil, Trash2, Plus } from "lucide-react";
import type { Supplier } from "@/types";
import { Input, Btn, EmptyState, Modal, Skeleton } from "@/components/ui";

interface SuppliersViewProps {
  suppliers:  Supplier[];
  loading:    boolean;
  showToast:  (msg: string, type: "success" | "error") => void;
  refresh:    () => Promise<void>;
}

export function SuppliersView({ suppliers, loading, showToast, refresh }: SuppliersViewProps) {

  const [modal, setModal]  = useState<{ open: boolean; supplier: Supplier | null }>({ open: false, supplier: null });
  const [form,  setForm]   = useState({ name: "", contactName: "", phone: "", email: "" });
  const [saving, setSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleting,      setDeleting]      = useState(false);

  const openAdd = () => {
    setForm({ name: "", contactName: "", phone: "", email: "" });
    setModal({ open: true, supplier: null });
  };

  const openEdit = (s: Supplier) => {
    setForm({ name: s.name, contactName: s.contactName, phone: s.phone, email: s.email });
    setModal({ open: true, supplier: s });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = !!modal.supplier;
      const url    = isEdit ? `/api/suppliers/${modal.supplier!.id}` : "/api/suppliers";
      const res    = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        showToast(isEdit ? "แก้ไขผู้จัดจำหน่ายแล้ว" : `เพิ่ม "${form.name}" แล้ว`, "success");
        setModal({ open: false, supplier: null });
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
      const res  = await fetch(`/api/suppliers/${deleteConfirm.id}`, { method: "DELETE" });
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

  return (
    <>
      {/* ── Supplier Modal ─────────────────────────────────────────────────── */}
      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, supplier: null })}
        title={modal.supplier ? "แก้ไขผู้จัดจำหน่าย" : "เพิ่มผู้จัดจำหน่าย"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="ชื่อบริษัท / ผู้จัดจำหน่าย" required autoFocus
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="ชื่อผู้ติดต่อ"
            value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="เบอร์โทร"
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <Input label="อีเมล" type="email"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-1">
            <Btn type="button" variant="ghost" className="flex-1" onClick={() => setModal({ open: false, supplier: null })}>ยกเลิก</Btn>
            <Btn type="submit" loading={saving} className="flex-1">
              <Plus size={14} />{modal.supplier ? "บันทึก" : "เพิ่ม"}
            </Btn>
          </div>
        </form>
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
                <p className="text-xs text-rose-600 mt-1">ผู้จัดจำหน่ายนี้จะถูกลบออกถาวร</p>
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

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="space-y-4 max-w-7xl">
        <div className="flex items-center justify-end">
          <Btn onClick={openAdd}><Plus size={15} />เพิ่มผู้จัดจำหน่าย</Btn>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">รายชื่อผู้จัดจำหน่าย</h2>
            <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">{suppliers.length} ราย</span>
          </div>

          {loading ? (
            <div className="divide-y divide-slate-50">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
              ))}
            </div>
          ) : suppliers.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="ยังไม่มีผู้จัดจำหน่าย"
              desc="เพิ่มผู้จัดจำหน่ายเพื่อติดตามแหล่งที่มาของสินค้า"
              action={{ label: "เพิ่มผู้จัดจำหน่ายแรก", onClick: openAdd }}
            />
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
                      {s.phone       && <p className="text-xs text-slate-400 font-mono">{s.phone}</p>}
                      {s.email       && <p className="text-xs text-slate-400">{s.email}</p>}
                    </div>
                    <p className="text-[10px] text-slate-300 mt-1">
                      เพิ่มเมื่อ{" "}
                      {new Date(s.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => openEdit(s)} title="แก้ไข"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"><Pencil size={13} /></button>
                    <button onClick={() => setDeleteConfirm({ id: s.id, name: s.name })} title="ลบ"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
