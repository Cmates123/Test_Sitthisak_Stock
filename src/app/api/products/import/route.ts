import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { readSheet, appendRow, initSheets, SHEETS, nowBKK } from "@/lib/googleSheets";

// POST /api/products/import — Bulk import products from CSV rows
// Body: { rows: Array<{ name, sku, costPrice, sellingPrice?, stockQuantity?, minStock?, categoryId }> }
export async function POST(request: NextRequest) {
  try {
    await initSheets();
    const body = await request.json();
    const { rows } = body as { rows: Record<string, string>[] };

    if (!Array.isArray(rows) || rows.length === 0) {
      return Response.json({ success: false, error: "rows array is required" }, { status: 400 });
    }

    const catRows = await readSheet(SHEETS.CATEGORIES);
    const productRows = await readSheet(SHEETS.PRODUCTS);
    const existingSkus = new Set(productRows.map((r) => r[2]?.toUpperCase()));

    const imported: string[] = [];
    const skipped: string[] = [];

    for (const row of rows) {
      const name = String(row.name ?? "").trim();
      const sku = String(row.sku ?? "").trim().toUpperCase();
      const costPrice = parseFloat(row.costPrice ?? "0");
      const sellingPrice = row.sellingPrice ? parseFloat(row.sellingPrice) : null;
      const stockQuantity = parseInt(row.stockQuantity ?? "0");
      const minStock = parseInt(row.minStock ?? "5");
      const categoryId = String(row.categoryId ?? "").trim();

      if (!name || !sku || isNaN(costPrice)) {
        skipped.push(sku || name || "(empty)");
        continue;
      }

      if (existingSkus.has(sku)) {
        skipped.push(sku);
        continue;
      }

      const category = catRows.find((r) => r[0] === categoryId);
      if (!category) {
        skipped.push(sku);
        continue;
      }

      const id = uuidv4();
      const now = nowBKK();
      await appendRow(SHEETS.PRODUCTS, [
        id, name, sku,
        String(costPrice),
        String(stockQuantity),
        categoryId, category[1],
        now, now,
        sellingPrice !== null ? String(sellingPrice) : "",
        String(minStock),
      ]);
      existingSkus.add(sku);
      imported.push(sku);
    }

    return Response.json({ success: true, imported: imported.length, skipped: skipped.length, skippedItems: skipped });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
