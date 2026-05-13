import { google, sheets_v4 } from "googleapis";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID as string;

// Returns current time as Bangkok (UTC+7) ISO string so spreadsheet and app show the same date/time
export function nowBKK(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "+07:00");
}

// Sheet tab names
export const SHEETS = {
  CATEGORIES: "Categories",
  PRODUCTS: "Products",
  TRANSACTIONS: "StockTransactions",
  SUPPLIERS: "Suppliers",
} as const;

// Column headers for each sheet
export const HEADERS = {
  CATEGORIES:   ["รหัส", "ชื่อหมวดหมู่", "คำอธิบาย", "สร้างเมื่อ"],
  PRODUCTS:     ["รหัส", "ชื่อสินค้า", "รหัส SKU", "ราคาทุน", "จำนวนในสต็อก", "รหัสหมวดหมู่", "ชื่อหมวดหมู่", "สร้างเมื่อ", "แก้ไขล่าสุด", "ราคาขาย", "สต็อกขั้นต่ำ"],
  TRANSACTIONS: ["รหัส", "รหัสสินค้า", "ชื่อสินค้า", "ประเภท", "จำนวน", "เหตุผล", "วันที่/เวลา"],
  SUPPLIERS:    ["รหัส", "ชื่อผู้จัดจำหน่าย", "ชื่อผู้ติดต่อ", "เบอร์โทร", "อีเมล", "สร้างเมื่อ"],
};

let _sheets: sheets_v4.Sheets | null = null;

function getSheetsClient(): sheets_v4.Sheets {
  if (_sheets) return _sheets;

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON as string);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  _sheets = google.sheets({ version: "v4", auth });
  return _sheets;
}

// Read all rows from a sheet (excludes header row)
export async function readSheet(sheetName: string): Promise<string[][]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
  });
  const rows = res.data.values ?? [];
  return rows.slice(1); // skip header row
}

// Append a row to a sheet
export async function appendRow(sheetName: string, values: string[]): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [values] },
  });
}

// Update a specific row by row index (1-based, accounting for header)
export async function updateRow(
  sheetName: string,
  rowIndex: number, // 1-based data row index (row 1 = first data row = spreadsheet row 2)
  values: string[]
): Promise<void> {
  const sheets = getSheetsClient();
  const sheetRow = rowIndex + 1; // +1 for header row
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [values] },
  });
}

// Delete a specific row by row index (1-based data row index)
export async function deleteRow(sheetName: string, rowIndex: number): Promise<void> {
  const sheets = getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = (meta.data.sheets ?? []).find((s) => s.properties?.title === sheetName);
  if (!sheet?.properties) throw new Error(`Sheet "${sheetName}" not found`);

  const sheetId = sheet.properties.sheetId!;
  const dataRowIndex = rowIndex; // rowIndex is 1-based data row; sheet row (0-indexed) = rowIndex

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: { sheetId, dimension: "ROWS", startIndex: dataRowIndex, endIndex: dataRowIndex + 1 },
        },
      }],
    },
  });
}

let _initDone = false;

// Ensure all required sheets exist and have headers (runs only once per server process)
export async function initSheets(): Promise<void> {
  if (_initDone) return;
  _initDone = true;

  const sheets = getSheetsClient();

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existingTitles = (meta.data.sheets ?? []).map((s) => s.properties?.title ?? "");

  const toCreate = Object.values(SHEETS).filter((name) => !existingTitles.includes(name));

  if (toCreate.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: toCreate.map((title) => ({
          addSheet: { properties: { title } },
        })),
      },
    });
  }

  // Write headers to any sheet that is missing them
  const headerMap: Record<string, string[]> = {
    [SHEETS.CATEGORIES]: HEADERS.CATEGORIES,
    [SHEETS.PRODUCTS]: HEADERS.PRODUCTS,
    [SHEETS.TRANSACTIONS]: HEADERS.TRANSACTIONS,
    [SHEETS.SUPPLIERS]: HEADERS.SUPPLIERS,
  };

  for (const [sheet, headers] of Object.entries(headerMap)) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheet}!A1:Z1`,
    });
    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheet}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
    }
  }
}
