"use client";

import { useState, useCallback } from "react";
import { Shield } from "lucide-react";
import type { Tab } from "@/types";
import { useInventory } from "@/hooks/useInventory";
import { Toast } from "@/components/ui";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { ProductsView }  from "@/features/products/ProductsView";
import { StockView }     from "@/features/stock/StockView";
import { SuppliersView } from "@/features/suppliers/SuppliersView";

export default function App() {
  const { products, categories, lowStock, transactions, suppliers, loading, connError, refresh } = useInventory();

  // ── Navigation
  const [tab,          setTab]          = useState<Tab>("dashboard");
  const [productView,  setProductView]  = useState<"all" | "low-stock" | "categories">("all");
  const [stockView,    setStockView]    = useState<"adjust" | "history">("adjust");
  const [sidebarOpen,  setSidebarOpen]  = useState(false);

  // ── Cross-view state
  const [addProductOpen,  setAddProductOpen]  = useState(false);
  const [presetProductId, setPresetProductId] = useState("");

  // ── Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Cross-view handlers
  const goAdjust = (productId: string) => {
    setPresetProductId(productId);
    setTab("stock");
    setStockView("adjust");
  };

  const loadSeedData = async () => {
    try {
      const res  = await fetch("/api/seed");
      const json = await res.json();
      if (json.success) { showToast("โหลดข้อมูลตัวอย่างแล้ว!", "success"); refresh(); }
      else               showToast(json.error, "error");
    } catch {
      showToast("เกิดข้อผิดพลาด", "error");
    }
  };

  const handleSetTab = (t: Tab) => {
    setTab(t);
    setSidebarOpen(false);
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <Sidebar
        tab={tab}               onSetTab={handleSetTab}
        productView={productView} onSetProductView={setProductView}
        stockView={stockView}     onSetStockView={setStockView}
        open={sidebarOpen}      onClose={() => setSidebarOpen(false)}
        lowStockCount={lowStock.length}
        connError={connError}
        loading={loading}
        onLoadSeed={loadSeedData}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          tab={tab}
          loading={loading}
          onRefresh={refresh}
          onMenuOpen={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

          {connError && (
            <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 text-sm text-amber-800">
              <Shield size={16} className="text-amber-500 shrink-0" />
              <div>
                <p className="font-semibold">เชื่อมต่อไม่ได้</p>
                <p className="text-xs mt-0.5">{connError}</p>
              </div>
            </div>
          )}

          {tab === "dashboard" && (
            <DashboardView
              products={products}
              categories={categories}
              lowStock={lowStock}
              transactions={transactions}
              loading={loading}
              onSetTab={handleSetTab}
              onSetProductView={setProductView}
              onSetStockView={setStockView}
              onAddProduct={() => { setTab("products"); setAddProductOpen(true); }}
              onGoAdjust={goAdjust}
              onLoadSeed={loadSeedData}
            />
          )}

          {tab === "products" && (
            <ProductsView
              products={products}
              categories={categories}
              loading={loading}
              addProductOpen={addProductOpen}
              onOpenAddProduct={() => setAddProductOpen(true)}
              onCloseAddProduct={() => setAddProductOpen(false)}
              showToast={showToast}
              refresh={refresh}
              onGoAdjust={goAdjust}
              productView={productView}
              onSetProductView={setProductView}
            />
          )}

          {tab === "stock" && (
            <StockView
              products={products}
              transactions={transactions}
              loading={loading}
              showToast={showToast}
              refresh={refresh}
              presetProductId={presetProductId}
              onClearPreset={() => setPresetProductId("")}
              stockView={stockView}
              onSetStockView={setStockView}
            />
          )}

          {tab === "suppliers" && (
            <SuppliersView
              suppliers={suppliers}
              loading={loading}
              showToast={showToast}
              refresh={refresh}
            />
          )}
        </main>
      </div>
    </div>
  );
}
