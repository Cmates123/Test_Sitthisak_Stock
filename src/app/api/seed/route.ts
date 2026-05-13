import { v4 as uuidv4 } from "uuid";
import { initSheets, appendRow, readSheet, SHEETS, HEADERS, nowBKK } from "@/lib/googleSheets";
import { google } from "googleapis";

// Helper: clear a sheet and re-write the header row
async function clearAndSeedSheet(sheetName: string, headers: string[], rows: string[][]) {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON as string);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.SPREADSHEET_ID as string;

  // Clear everything
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
  });

  // Write header + all data rows at once
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [headers, ...rows] },
  });
}

// GET /api/seed — Wipes all sheets and inserts realistic test data
export async function GET() {
  try {
    await initSheets();

    const bkkNow = Date.now() + 7 * 60 * 60 * 1000; // shift to Bangkok time
    const ts = (offsetDays = 0, offsetHours = 0) => {
      const ms = bkkNow - (offsetDays * 86400 + offsetHours * 3600) * 1000;
      return new Date(ms).toISOString().replace("Z", "+07:00");
    };

    // ── Categories ─────────────────────────────────────────────────────────
    // id, name, description, createdAt
    const catIT  = uuidv4();
    const catOS  = uuidv4();
    const catFN  = uuidv4();

    const categoryRows: string[][] = [
      [catIT,  "IT",             "อุปกรณ์เทคโนโลยีสารสนเทศ",  ts(30)],
      [catOS,  "Office Supply",  "เครื่องใช้สำนักงาน",           ts(30)],
      [catFN,  "Furniture",      "เฟอร์นิเจอร์สำนักงาน",        ts(30)],
    ];

    // ── Products ───────────────────────────────────────────────────────────
    // id, name, sku, costPrice, stockQuantity, categoryId, categoryName, createdAt, updatedAt
    const p1  = uuidv4(); // Mechanical Keyboard     — OK
    const p2  = uuidv4(); // Wireless Mouse           — LOW (3)
    const p3  = uuidv4(); // USB-C Hub                — CRITICAL (2)
    const p4  = uuidv4(); // 27" Monitor              — OK
    const p5  = uuidv4(); // HDMI Cable               — OUT (0)
    const p6  = uuidv4(); // Ballpoint Pen Pack       — OK
    const p7  = uuidv4(); // A4 Paper 500 Sheets      — CRITICAL (4)
    const p8  = uuidv4(); // Sticky Notes             — OK
    const p9  = uuidv4(); // Whiteboard Marker Set    — CRITICAL (1)
    const p10 = uuidv4(); // Office Chair             — OK
    const p11 = uuidv4(); // Standing Desk            — OUT (0)
    const p12 = uuidv4(); // Bookshelf                — OK

    // Columns: id, name, sku, costPrice, stockQuantity, categoryId, categoryName, createdAt, updatedAt, sellingPrice, minStock
    const productRows: string[][] = [
      // IT
      [p1,  "Mechanical Keyboard",  "KB-001",    "1500",   "20",  catIT, "IT",            ts(25), ts(2),  "2200",  "5"],
      [p2,  "Wireless Mouse",       "MS-002",    "850",    "3",   catIT, "IT",            ts(25), ts(1),  "1200",  "5"],
      [p3,  "USB-C Hub 7-in-1",    "HUB-003",   "1200",   "2",   catIT, "IT",            ts(24), ts(3),  "1800",  "5"],
      [p4,  "27-inch Monitor",      "MON-004",   "12500",  "8",   catIT, "IT",            ts(20), ts(5),  "16500", "3"],
      [p5,  "HDMI Cable 2m",        "HDMI-005",  "250",    "0",   catIT, "IT",            ts(20), ts(0),  "450",   "10"],
      // Office Supply
      [p6,  "Ballpoint Pen Pack",   "PEN-006",   "45",     "150", catOS, "Office Supply", ts(28), ts(10), "80",    "20"],
      [p7,  "A4 Paper 500 Sheets",  "PAP-007",   "120",    "4",   catOS, "Office Supply", ts(28), ts(1),  "180",   "10"],
      [p8,  "Sticky Notes 5-pack",  "STK-008",   "35",     "60",  catOS, "Office Supply", ts(27), ts(7),  "59",    "10"],
      [p9,  "Whiteboard Marker Set","MRK-009",   "95",     "1",   catOS, "Office Supply", ts(27), ts(2),  "149",   "5"],
      // Furniture
      [p10, "Ergonomic Chair",      "CHR-010",   "4500",   "6",   catFN, "Furniture",     ts(15), ts(15), "6500",  "2"],
      [p11, "Standing Desk",        "DSK-011",   "15000",  "0",   catFN, "Furniture",     ts(15), ts(0),  "21000", "2"],
      [p12, "3-Tier Bookshelf",     "BSH-012",   "2800",   "10",  catFN, "Furniture",     ts(14), ts(14), "3900",  "3"],
    ];

    // ── Stock Transactions ─────────────────────────────────────────────────
    // id, productId, productName, type, quantity, reason, createdAt
    const txRows: string[][] = [
      // Initial stock ins (oldest)
      [uuidv4(), p1,  "Mechanical Keyboard",  "IN",  "25",  "รับสินค้าจากซัพพลายเออร์ครั้งแรก",    ts(25, 6)],
      [uuidv4(), p2,  "Wireless Mouse",       "IN",  "20",  "รับสินค้าจากซัพพลายเออร์ครั้งแรก",    ts(25, 6)],
      [uuidv4(), p3,  "USB-C Hub 7-in-1",    "IN",  "15",  "รับสินค้าจากซัพพลายเออร์ครั้งแรก",    ts(24, 6)],
      [uuidv4(), p4,  "27-inch Monitor",      "IN",  "10",  "รับสินค้าจากซัพพลายเออร์ครั้งแรก",    ts(20, 6)],
      [uuidv4(), p5,  "HDMI Cable 2m",        "IN",  "30",  "รับสินค้าจากซัพพลายเออร์ครั้งแรก",    ts(20, 5)],
      [uuidv4(), p6,  "Ballpoint Pen Pack",   "IN",  "200", "รับสินค้าจากซัพพลายเออร์ครั้งแรก",    ts(28, 6)],
      [uuidv4(), p7,  "A4 Paper 500 Sheets",  "IN",  "50",  "รับสินค้าจากซัพพลายเออร์ครั้งแรก",    ts(28, 6)],
      [uuidv4(), p8,  "Sticky Notes 5-pack",  "IN",  "80",  "รับสินค้าจากซัพพลายเออร์ครั้งแรก",    ts(27, 6)],
      [uuidv4(), p9,  "Whiteboard Marker Set","IN",  "20",  "รับสินค้าจากซัพพลายเออร์ครั้งแรก",    ts(27, 6)],
      [uuidv4(), p10, "Ergonomic Chair",      "IN",  "8",   "รับสินค้าจากซัพพลายเออร์ครั้งแรก",    ts(15, 6)],
      [uuidv4(), p11, "Standing Desk",        "IN",  "5",   "รับสินค้าจากซัพพลายเออร์ครั้งแรก",    ts(15, 6)],
      [uuidv4(), p12, "3-Tier Bookshelf",     "IN",  "12",  "รับสินค้าจากซัพพลายเออร์ครั้งแรก",    ts(14, 6)],

      // Sales / usage outs
      [uuidv4(), p1,  "Mechanical Keyboard",  "OUT", "5",   "จำหน่ายให้แผนก Marketing",              ts(18, 2)],
      [uuidv4(), p2,  "Wireless Mouse",       "OUT", "12",  "จำหน่ายให้แผนก HR และ Finance",          ts(16, 3)],
      [uuidv4(), p3,  "USB-C Hub 7-in-1",    "OUT", "10",  "จำหน่ายให้แผนก Engineering",             ts(15, 4)],
      [uuidv4(), p4,  "27-inch Monitor",      "OUT", "2",   "จำหน่ายให้ทีม Design",                   ts(12, 1)],
      [uuidv4(), p5,  "HDMI Cable 2m",        "OUT", "28",  "จำหน่ายและสูญหาย",                       ts(10, 5)],
      [uuidv4(), p6,  "Ballpoint Pen Pack",   "OUT", "50",  "แจกให้พนักงานทั้งบริษัท",                ts(20, 2)],
      [uuidv4(), p7,  "A4 Paper 500 Sheets",  "OUT", "46",  "ใช้ในสำนักงาน",                          ts(8,  1)],
      [uuidv4(), p8,  "Sticky Notes 5-pack",  "OUT", "20",  "แจกฝ่าย Admin",                          ts(14, 3)],
      [uuidv4(), p9,  "Whiteboard Marker Set","OUT", "19",  "ใช้ในห้องประชุมและสูญหาย",               ts(5,  2)],
      [uuidv4(), p10, "Ergonomic Chair",      "OUT", "2",   "จำหน่ายให้ CEO และ CFO",                 ts(7,  1)],
      [uuidv4(), p11, "Standing Desk",        "OUT", "5",   "จำหน่ายครบ 5 ตัว",                       ts(3,  4)],
      [uuidv4(), p12, "3-Tier Bookshelf",     "OUT", "2",   "ติดตั้งในห้องสมุดบริษัท",                ts(6,  2)],

      // Recent restocks
      [uuidv4(), p1,  "Mechanical Keyboard",  "IN",  "10",  "เติมสต็อกรอบใหม่จากซัพพลายเออร์",       ts(5,  3)],
      [uuidv4(), p6,  "Ballpoint Pen Pack",   "IN",  "100", "สั่งซื้อเพิ่ม Batch 2",                  ts(4,  1)],
      [uuidv4(), p8,  "Sticky Notes 5-pack",  "IN",  "20",  "เติมสต็อก",                               ts(3,  2)],

      // Today's activity
      [uuidv4(), p2,  "Wireless Mouse",       "OUT", "5",   "จำหน่ายวันนี้ — ลูกค้า walk-in",         ts(0,  2)],
      [uuidv4(), p4,  "27-inch Monitor",      "OUT", "0",   "ตรวจนับสต็อก ไม่พบความเพี้ยน",           ts(0,  1)],
      [uuidv4(), p6,  "Ballpoint Pen Pack",   "OUT", "15",  "แจกพนักงานใหม่ Onboarding วันนี้",       ts(0,  0)],
    ];

    // ── Suppliers ──────────────────────────────────────────────────────────
    // id, name, contactName, phone, email, createdAt
    const supplierRows: string[][] = [
      [uuidv4(), "Tech Distributor Co.",   "คุณสมชาย ใจดี",      "02-555-1001", "somchai@techdist.th",  ts(60)],
      [uuidv4(), "Office Supplies Ltd.",   "คุณวิไล รักงาน",     "02-555-2002", "wilai@officesup.th",   ts(55)],
      [uuidv4(), "Furniture World Corp.",  "คุณประเสริฐ มั่นคง",  "02-555-3003", "prasert@furniworld.th", ts(50)],
    ];

    // Write all sheets in parallel
    await Promise.all([
      clearAndSeedSheet(SHEETS.CATEGORIES,   HEADERS.CATEGORIES,   categoryRows),
      clearAndSeedSheet(SHEETS.PRODUCTS,     HEADERS.PRODUCTS,     productRows),
      clearAndSeedSheet(SHEETS.TRANSACTIONS, HEADERS.TRANSACTIONS, txRows),
      clearAndSeedSheet(SHEETS.SUPPLIERS,    HEADERS.SUPPLIERS,    supplierRows),
    ]);

    return Response.json({
      success: true,
      message: "Seed completed",
      summary: {
        categories: categoryRows.length,
        products: productRows.length,
        transactions: txRows.length,
        suppliers: supplierRows.length,
        lowStockItems: productRows.filter(r => parseInt(r[4]) <= parseInt(r[10] ?? "5")).map(r => `${r[2]} (${r[4]})`),
      },
    });
  } catch (err: any) {
    console.error(err);
    return Response.json(
      { success: false, error: err.message ?? "Seed failed" },
      { status: 500 }
    );
  }
}
