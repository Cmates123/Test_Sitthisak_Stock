import { readSheet, initSheets, SHEETS } from "@/lib/googleSheets";

// GET /api/products/export — Download all products as CSV
export async function GET() {
  try {
    await initSheets();
    const rows = await readSheet(SHEETS.PRODUCTS);

    const header = ["รหัส", "ชื่อสินค้า", "รหัส SKU", "ราคาทุน", "ราคาขาย", "จำนวนในสต็อก", "สต็อกขั้นต่ำ", "หมวดหมู่", "สร้างเมื่อ", "แก้ไขล่าสุด"];
    const csvRows = rows.map((r) => [
      r[0], r[1], r[2], r[3],
      r[9] ?? "",
      r[4], r[10] ?? "5",
      r[6], r[7], r[8],
    ]);

    const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [header, ...csvRows].map((row) => row.map(escape).join(",")).join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="products_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
