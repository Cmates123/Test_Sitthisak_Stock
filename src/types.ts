export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  costPrice: number;
  stockQuantity: number;
  category: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  sellingPrice: number | null;
  minStock: number;
}

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  type: "IN" | "OUT";
  quantity: number;
  reason: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  createdAt: string;
}

export type Tab = "dashboard" | "products" | "stock" | "suppliers";
export type SortDir = "asc" | "desc";
