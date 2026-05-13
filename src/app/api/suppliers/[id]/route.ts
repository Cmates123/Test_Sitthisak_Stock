import { NextRequest } from "next/server";
import { readSheet, updateRow, deleteRow, initSheets, SHEETS, nowBKK } from "@/lib/googleSheets";

// PATCH /api/suppliers/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initSheets();
    const { id } = await params;
    const body = await request.json();
    const { name, contactName, phone, email } = body;

    const rows = await readSheet(SHEETS.SUPPLIERS);
    const rowIndex = rows.findIndex((r) => r[0] === id);
    if (rowIndex === -1) {
      return Response.json({ success: false, error: "Supplier not found" }, { status: 404 });
    }

    const existing = rows[rowIndex];
    const updatedRow = [
      existing[0],
      name ?? existing[1],
      contactName ?? existing[2] ?? "",
      phone ?? existing[3] ?? "",
      email ?? existing[4] ?? "",
      existing[5], // createdAt unchanged
    ];

    await updateRow(SHEETS.SUPPLIERS, rowIndex + 1, updatedRow);

    return Response.json({
      success: true,
      data: {
        id: updatedRow[0],
        name: updatedRow[1],
        contactName: updatedRow[2],
        phone: updatedRow[3],
        email: updatedRow[4],
        createdAt: updatedRow[5],
      },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/suppliers/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initSheets();
    const { id } = await params;

    const rows = await readSheet(SHEETS.SUPPLIERS);
    const rowIndex = rows.findIndex((r) => r[0] === id);
    if (rowIndex === -1) {
      return Response.json({ success: false, error: "Supplier not found" }, { status: 404 });
    }

    await deleteRow(SHEETS.SUPPLIERS, rowIndex + 1);
    return Response.json({ success: true, message: "Supplier deleted" });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
