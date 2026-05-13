import { readSheet, initSheets, SHEETS } from "@/lib/googleSheets";

// GET /api/transactions/export — Download all transactions as CSV
export async function GET() {
  try {
    await initSheets();
    const rows = await readSheet(SHEETS.TRANSACTIONS);

    const header = ["รหัส", "รหัสสินค้า", "ชื่อสินค้า", "ประเภท", "จำนวน", "เหตุผล", "วันที่/เวลา"];
    const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transactions_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
