import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { readSheet, appendRow, updateRow, initSheets, SHEETS, nowBKK } from "@/lib/googleSheets";

// PATCH /api/stock/adjust — Adjust product stock and record a transaction
export async function PATCH(request: NextRequest) {
  try {
    await initSheets();

    const body = await request.json();
    const { productId, adjustment, reason } = body;

    if (!productId || adjustment === undefined || !reason) {
      return Response.json(
        { success: false, error: "productId, adjustment, and reason are required" },
        { status: 400 }
      );
    }

    if (typeof adjustment !== "number" || adjustment === 0) {
      return Response.json(
        { success: false, error: "adjustment must be a non-zero number" },
        { status: 400 }
      );
    }

    const productRows = await readSheet(SHEETS.PRODUCTS);
    const rowIndex = productRows.findIndex((r) => r[0] === productId);
    if (rowIndex === -1) {
      return Response.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const product = productRows[rowIndex];
    const currentStock = parseInt(product[4]);
    const newStock = currentStock + adjustment;

    if (newStock < 0) {
      return Response.json(
        {
          success: false,
          error: `Insufficient stock. Current: ${currentStock}, adjustment: ${adjustment}`,
        },
        { status: 422 }
      );
    }

    const now = nowBKK();

    // Update stockQuantity and updatedAt in Products sheet
    // Columns: id, name, sku, costPrice, stockQuantity, categoryId, categoryName, createdAt, updatedAt, sellingPrice, minStock
    const updatedRow = [
      product[0], // id
      product[1], // name
      product[2], // sku
      product[3], // costPrice
      String(newStock),
      product[5], // categoryId
      product[6], // categoryName
      product[7], // createdAt
      now,         // updatedAt
      product[9] ?? "", // sellingPrice
      product[10] ?? "5", // minStock
    ];
    await updateRow(SHEETS.PRODUCTS, rowIndex + 1, updatedRow);

    // Record transaction
    // Columns: id, productId, productName, type, quantity, reason, createdAt
    await appendRow(SHEETS.TRANSACTIONS, [
      uuidv4(),
      productId,
      product[1],
      adjustment > 0 ? "IN" : "OUT",
      String(Math.abs(adjustment)),
      reason,
      now,
    ]);

    return Response.json({
      success: true,
      data: {
        productId,
        name: product[1],
        sku: product[2],
        previousStock: currentStock,
        adjustment,
        newStock,
      },
    });
  } catch (err) {
    console.error(err);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
