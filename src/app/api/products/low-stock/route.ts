import { readSheet, initSheets, SHEETS } from "@/lib/googleSheets";

// GET /api/products/low-stock — Products where stockQuantity <= minStock
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

    const lowStock = products
      .filter((p) => p.stockQuantity <= p.minStock)
      .sort((a, b) => a.stockQuantity - b.stockQuantity);

    return Response.json({
      success: true,
      count: lowStock.length,
      data: lowStock,
    });
  } catch (err) {
    console.error(err);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
