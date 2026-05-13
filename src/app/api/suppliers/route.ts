import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { readSheet, appendRow, initSheets, SHEETS, nowBKK } from "@/lib/googleSheets";

// GET /api/suppliers — List all suppliers
export async function GET() {
  try {
    await initSheets();
    const rows = await readSheet(SHEETS.SUPPLIERS);
    const suppliers = rows.map((r) => ({
      id: r[0],
      name: r[1],
      contactName: r[2] ?? "",
      phone: r[3] ?? "",
      email: r[4] ?? "",
      createdAt: r[5],
    }));
    return Response.json({ success: true, data: suppliers });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/suppliers — Create a new supplier
export async function POST(request: NextRequest) {
  try {
    await initSheets();
    const body = await request.json();
    const { name, contactName = "", phone = "", email = "" } = body;

    if (!name) {
      return Response.json({ success: false, error: "name is required" }, { status: 400 });
    }

    const rows = await readSheet(SHEETS.SUPPLIERS);
    if (rows.some((r) => r[1]?.toLowerCase() === String(name).toLowerCase())) {
      return Response.json({ success: false, error: "Supplier name already exists" }, { status: 409 });
    }

    const id = uuidv4();
    const now = nowBKK();
    await appendRow(SHEETS.SUPPLIERS, [id, name, contactName, phone, email, now]);

    return Response.json(
      { success: true, data: { id, name, contactName, phone, email, createdAt: now } },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
