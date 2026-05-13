import { readSheet, updateRow, initSheets, SHEETS } from "@/lib/googleSheets";

function utcToBKK(s: string): string {
  if (!s || !s.endsWith("Z")) return s;
  return new Date(new Date(s).getTime() + 7 * 60 * 60 * 1000)
    .toISOString().replace("Z", "+07:00");
}

// GET /api/migrate-timestamps — One-time migration: convert all UTC timestamps to Bangkok (+07:00)
export async function GET() {
  try {
    await initSheets();
    let converted = 0;

    // Categories: [id, name, description, createdAt]
    const catRows = await readSheet(SHEETS.CATEGORIES);
    for (let i = 0; i < catRows.length; i++) {
      const r = catRows[i];
      if (r[3]?.endsWith("Z")) {
        await updateRow(SHEETS.CATEGORIES, i + 1, [r[0], r[1], r[2] ?? "", utcToBKK(r[3])]);
        converted++;
      }
    }

    // Products: [id, name, sku, costPrice, stockQuantity, categoryId, categoryName, createdAt, updatedAt]
    const prodRows = await readSheet(SHEETS.PRODUCTS);
    for (let i = 0; i < prodRows.length; i++) {
      const r = prodRows[i];
      if (r[7]?.endsWith("Z") || r[8]?.endsWith("Z")) {
        await updateRow(SHEETS.PRODUCTS, i + 1, [
          r[0], r[1], r[2], r[3], r[4], r[5], r[6],
          utcToBKK(r[7]), utcToBKK(r[8]),
        ]);
        converted++;
      }
    }

    // StockTransactions: [id, productId, productName, type, quantity, reason, createdAt]
    const txRows = await readSheet(SHEETS.TRANSACTIONS);
    for (let i = 0; i < txRows.length; i++) {
      const r = txRows[i];
      if (r[6]?.endsWith("Z")) {
        await updateRow(SHEETS.TRANSACTIONS, i + 1, [
          r[0], r[1], r[2], r[3], r[4], r[5], utcToBKK(r[6]),
        ]);
        converted++;
      }
    }

    return Response.json({
      success: true,
      converted,
      message: `แปลง ${converted} รายการเป็นเวลาไทย (+07:00) เรียบร้อยแล้ว`,
    });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
