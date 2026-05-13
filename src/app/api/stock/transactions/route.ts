import { readSheet, initSheets, SHEETS } from "@/lib/googleSheets";

// GET /api/stock/transactions — List all stock transactions
export async function GET() {
  try {
    await initSheets();
    const rows = await readSheet(SHEETS.TRANSACTIONS);
    const transactions = rows.map((r) => ({
      id: r[0],
      productId: r[1],
      productName: r[2],
      type: r[3] as "IN" | "OUT",
      quantity: parseInt(r[4]),
      reason: r[5],
      createdAt: r[6],
    }));
    return Response.json({ success: true, data: transactions });
  } catch (err) {
    console.error(err);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
