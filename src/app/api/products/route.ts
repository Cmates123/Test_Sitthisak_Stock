import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { readSheet, appendRow, initSheets, SHEETS, nowBKK } from "@/lib/googleSheets";

// POST /api/products — Add a new product
export async function POST(request: NextRequest) {
  try {
    await initSheets();

    const body = await request.json();
    const { name, sku, costPrice, stockQuantity = 0, categoryId, sellingPrice, minStock = 5 } = body;

    if (!name || !sku || costPrice === undefined || !categoryId) {
      return Response.json(
        { success: false, error: "name, sku, costPrice, and categoryId are required" },
        { status: 400 }
      );
    }

    if (typeof costPrice !== "number" || costPrice < 0) {
      return Response.json(
        { success: false, error: "costPrice must be a non-negative number" },
        { status: 400 }
      );
    }

    // Verify category exists
    const catRows = await readSheet(SHEETS.CATEGORIES);
    const category = catRows.find((r) => r[0] === categoryId);
    if (!category) {
      return Response.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    // Check SKU uniqueness
    const productRows = await readSheet(SHEETS.PRODUCTS);
    const skuNormalized = String(sku).toUpperCase();
    const duplicate = productRows.find((r) => r[2] === skuNormalized);
    if (duplicate) {
      return Response.json(
        { success: false, error: "SKU already exists" },
        { status: 409 }
      );
    }

    const now = nowBKK();
    const id = uuidv4();

    // Columns: id, name, sku, costPrice, stockQuantity, categoryId, categoryName, createdAt, updatedAt, sellingPrice, minStock
    await appendRow(SHEETS.PRODUCTS, [
      id,
      name,
      skuNormalized,
      String(costPrice),
      String(stockQuantity),
      categoryId,
      category[1], // categoryName
      now,
      now,
      sellingPrice !== undefined ? String(sellingPrice) : "",
      String(minStock),
    ]);

    return Response.json(
      {
        success: true,
        data: {
          id,
          name,
          sku: skuNormalized,
          costPrice,
          stockQuantity,
          category: { id: categoryId, name: category[1] },
          createdAt: now,
          updatedAt: now,
          sellingPrice: sellingPrice ?? null,
          minStock,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/products — List all products
export async function GET() {
  try {
    await initSheets();
    const rows = await readSheet(SHEETS.PRODUCTS);
    const products = rows.map((r) => ({
      id: r[0],
      name: r[1],
      sku: r[2],
      costPrice: parseFloat(r[3]),
      stockQuantity: parseInt(r[4]),
      category: { id: r[5], name: r[6] },
      createdAt: r[7],
      updatedAt: r[8],
      sellingPrice: r[9] ? parseFloat(r[9]) : null,
      minStock: r[10] ? parseInt(r[10]) : 5,
    }));
    return Response.json({ success: true, data: products });
  } catch (err) {
    console.error(err);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
