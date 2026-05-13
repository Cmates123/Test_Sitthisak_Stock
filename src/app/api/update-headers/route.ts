import { initSheets, SHEETS, HEADERS } from "@/lib/googleSheets";
import { google } from "googleapis";

// GET /api/update-headers — Overwrite row 1 of every sheet with Thai headers
export async function GET() {
  try {
    await initSheets();

    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON as string);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.SPREADSHEET_ID as string;

    const headerMap: Record<string, string[]> = {
      [SHEETS.CATEGORIES]:   HEADERS.CATEGORIES,
      [SHEETS.PRODUCTS]:     HEADERS.PRODUCTS,
      [SHEETS.TRANSACTIONS]: HEADERS.TRANSACTIONS,
    };

    for (const [sheet, headers] of Object.entries(headerMap)) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheet}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
    }

    return Response.json({ success: true, message: "อัปเดตหัวตารางเป็นภาษาไทยแล้ว" });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
