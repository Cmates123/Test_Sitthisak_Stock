import { NextRequest } from "next/server";
import { readSheet, updateRow, deleteRow, initSheets, SHEETS, nowBKK } from "@/lib/googleSheets";

// PATCH /api/products/[id] — Edit product fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initSheets();
    const { id } = await params;
    const body = await request.json();
    const { name, sku, costPrice, categoryId, sellingPrice, minStock } = body;

    const productRows = await readSheet(SHEETS.PRODUCTS);
    const rowIndex = productRows.findIndex((r) => r[0] === id);
    if (rowIndex === -1) {
      return Response.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const existing = productRows[rowIndex];

    // Validate costPrice if provided
    if (costPrice !== undefined && (typeof costPrice !== "number" || costPrice < 0)) {
      return Response.json({ success: false, error: "costPrice must be a non-negative number" }, { status: 400 });
    }

    // SKU uniqueness check (exclude current product)
    const newSku = sku ? String(sku).toUpperCase() : existing[2];
    if (sku && newSku !== existing[2]) {
      const duplicate = productRows.find((r, i) => i !== rowIndex && r[2] === newSku);
      if (duplicate) {
        return Response.json({ success: false, error: "SKU already exists" }, { status: 409 });
      }
    }

    // Category lookup if changing category
    let newCategoryName = existing[6];
    const newCategoryId = categoryId ?? existing[5];
    if (categoryId && categoryId !== existing[5]) {
      const catRows = await readSheet(SHEETS.CATEGORIES);
      const cat = catRows.find((r) => r[0] === categoryId);
      if (!cat) {
        return Response.json({ success: false, error: "Category not found" }, { status: 404 });
      }
      newCategoryName = cat[1];
    }

    const now = nowBKK();
    const updatedRow = [
      existing[0],
      name ?? existing[1],
      newSku,
      costPrice !== undefined ? String(costPrice) : existing[3],
      existing[4], // stockQuantity unchanged
      newCategoryId,
      newCategoryName,
      existing[7], // createdAt unchanged
      now,
      sellingPrice !== undefined ? String(sellingPrice) : (existing[9] ?? ""),
      minStock !== undefined ? String(minStock) : (existing[10] ?? "5"),
    ];

    await updateRow(SHEETS.PRODUCTS, rowIndex + 1, updatedRow);

    return Response.json({
      success: true,
      data: {
        id: existing[0],
        name: updatedRow[1],
        sku: updatedRow[2],
        costPrice: parseFloat(updatedRow[3]),
        stockQuantity: parseInt(updatedRow[4]),
        category: { id: updatedRow[5], name: updatedRow[6] },
        updatedAt: now,
        sellingPrice: updatedRow[9] ? parseFloat(updatedRow[9]) : null,
        minStock: parseInt(updatedRow[10]),
      },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/products/[id] — Remove a product
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initSheets();
    const { id } = await params;

    const productRows = await readSheet(SHEETS.PRODUCTS);
    const rowIndex = productRows.findIndex((r) => r[0] === id);
    if (rowIndex === -1) {
      return Response.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    // rowIndex is 0-based; sheet row 0-indexed = rowIndex + 1 (skip header)
    await deleteRow(SHEETS.PRODUCTS, rowIndex + 1);

    return Response.json({ success: true, message: "Product deleted" });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
