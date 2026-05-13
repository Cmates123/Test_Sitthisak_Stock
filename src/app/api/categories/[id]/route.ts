import { NextRequest } from "next/server";
import { readSheet, deleteRow, initSheets, SHEETS } from "@/lib/googleSheets";

// DELETE /api/categories/[id] — Remove a category (blocked if products use it)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initSheets();
    const { id } = await params;

    const catRows = await readSheet(SHEETS.CATEGORIES);
    const rowIndex = catRows.findIndex((r) => r[0] === id);
    if (rowIndex === -1) {
      return Response.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    // Block deletion if any product references this category
    const productRows = await readSheet(SHEETS.PRODUCTS);
    const inUse = productRows.filter((r) => r[5] === id);
    if (inUse.length > 0) {
      return Response.json(
        {
          success: false,
          error: `Cannot delete: ${inUse.length} product${inUse.length > 1 ? "s" : ""} still use this category`,
        },
        { status: 409 }
      );
    }

    await deleteRow(SHEETS.CATEGORIES, rowIndex + 1);

    return Response.json({ success: true, message: "Category deleted" });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
