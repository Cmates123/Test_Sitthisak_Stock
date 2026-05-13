import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { readSheet, appendRow, initSheets, SHEETS, nowBKK } from "@/lib/googleSheets";

// GET /api/categories — List all categories
export async function GET() {
  try {
    await initSheets();
    const rows = await readSheet(SHEETS.CATEGORIES);
    const categories = rows.map((r) => ({
      id: r[0],
      name: r[1],
      description: r[2] ?? "",
      createdAt: r[3],
    }));
    return Response.json({ success: true, data: categories });
  } catch (err) {
    console.error(err);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/categories — Create a new category
export async function POST(request: NextRequest) {
  try {
    await initSheets();

    const body = await request.json();
    const { name, description = "" } = body;

    if (!name) {
      return Response.json(
        { success: false, error: "name is required" },
        { status: 400 }
      );
    }

    // Check uniqueness
    const rows = await readSheet(SHEETS.CATEGORIES);
    const exists = rows.some((r) => r[1]?.toLowerCase() === String(name).toLowerCase());
    if (exists) {
      return Response.json(
        { success: false, error: "Category name already exists" },
        { status: 409 }
      );
    }

    const id = uuidv4();
    const now = nowBKK();

    await appendRow(SHEETS.CATEGORIES, [id, name, description, now]);

    return Response.json(
      { success: true, data: { id, name, description, createdAt: now } },
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
