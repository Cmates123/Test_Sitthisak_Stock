"use client";

import { useState, useEffect, useCallback } from "react";
import type { Category, Product, Transaction, Supplier } from "@/types";

export interface InventoryData {
  products:     Product[];
  categories:   Category[];
  lowStock:     Product[];
  transactions: Transaction[];
  suppliers:    Supplier[];
  loading:      boolean;
  connError:    string | null;
  refresh:      () => Promise<void>;
}

export function useInventory(): InventoryData {
  const [products,     setProducts]   = useState<Product[]>([]);
  const [categories,   setCategories] = useState<Category[]>([]);
  const [lowStock,     setLowStock]   = useState<Product[]>([]);
  const [transactions, setTx]         = useState<Transaction[]>([]);
  const [suppliers,    setSuppliers]  = useState<Supplier[]>([]);
  const [loading,      setLoading]    = useState(true);
  const [connError,    setConnError]  = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setConnError(null);
    try {
      const [pr, cr, lr, tr, sr] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
        fetch("/api/products/low-stock"),
        fetch("/api/stock/transactions"),
        fetch("/api/suppliers"),
      ]);
      const [p, c, l, t, s] = await Promise.all([
        pr.json(), cr.json(), lr.json(), tr.json(), sr.json(),
      ]);
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

  useEffect(() => { refresh(); }, [refresh]);

  return { products, categories, lowStock, transactions, suppliers, loading, connError, refresh };
}
