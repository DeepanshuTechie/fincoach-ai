import * as XLSX from "xlsx";

export type NormalizedStatementRow = {
  description: string;
  amount: string;
  date: string;
};

// Normalize unknown bank headers into standard description, amount, date
export function normalizeBankRow(row: Record<string, unknown>): NormalizedStatementRow | null {
  const keys = Object.keys(row);
  if (keys.length === 0) return null;

  let description = "";
  let amount = "";
  let date = "";

  for (const key of keys) {
    const k = key.trim().toLowerCase();
    const val = String(row[key] ?? "").trim();
    if (!val) continue;

    // Description / Merchant mapping
    if (!description) {
      if (
        k.includes("desc") ||
        k.includes("narration") ||
        k.includes("particular") ||
        k.includes("remark") ||
        k.includes("detail") ||
        k.includes("merchant") ||
        k.includes("payee") ||
        k.includes("transaction")
      ) {
        description = val;
      }
    }

    // Amount mapping (supports Debit, Withdrawal, Amount)
    if (!amount) {
      if (
        k.includes("amount") ||
        k.includes("debit") ||
        k.includes("withdrawal") ||
        k.includes("dr") ||
        k.includes("spent") ||
        k.includes("value")
      ) {
        // Strip currency symbols (₹, $, commas)
        const cleanAmt = val.replace(/[₹$,\s]/g, "");
        const num = parseFloat(cleanAmt);
        if (!isNaN(num) && num !== 0) {
          amount = Math.abs(num).toFixed(2);
        }
      }
    }

    // Date mapping
    if (!date) {
      if (
        k.includes("date") ||
        k.includes("txn_date") ||
        k.includes("value_date") ||
        k.includes("posting")
      ) {
        date = normalizeDate(val);
      }
    }
  }

  // Fallback heuristic if headers didn't match perfectly
  if (!description) {
    // Pick the longest string value
    const candidate = Object.values(row).find(
      (v) => typeof v === "string" && v.length > 3 && isNaN(Number(v))
    );
    if (candidate) description = String(candidate);
  }

  if (!amount) {
    // Pick the first numeric field
    for (const val of Object.values(row)) {
      const clean = String(val ?? "").replace(/[₹$,\s]/g, "");
      const num = parseFloat(clean);
      if (!isNaN(num) && num > 0) {
        amount = num.toFixed(2);
        break;
      }
    }
  }

  if (!date) {
    date = new Date().toISOString().split("T")[0];
  }

  if (!description || !amount) {
    return null;
  }

  return {
    description,
    amount,
    date,
  };
}

// Convert common bank date formats (DD/MM/YYYY, MM/DD/YYYY, DD-MMM-YYYY) to YYYY-MM-DD
function normalizeDate(raw: string): string {
  try {
    const clean = raw.trim();
    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

    // DD/MM/YYYY or DD-MM-YYYY
    const dmy = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
    if (dmy) {
      const day = dmy[1].padStart(2, "0");
      const month = dmy[2].padStart(2, "0");
      let year = dmy[3];
      if (year.length === 2) year = "20" + year;
      return `${year}-${month}-${day}`;
    }

    // Parse with Date constructor fallback
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  } catch (_) {}

  return new Date().toISOString().split("T")[0];
}

// Parse Excel (.xlsx, .xls) buffer into normalized statement rows
export function parseExcelStatement(arrayBuffer: ArrayBuffer): NormalizedStatementRow[] {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });

  const normalized: NormalizedStatementRow[] = [];
  for (const raw of rawRows) {
    const item = normalizeBankRow(raw);
    if (item) {
      normalized.push(item);
    }
  }

  return normalized;
}

// Convert normalized rows to standard RFC 4180 CSV string
export function convertRowsToCsv(rows: NormalizedStatementRow[]): string {
  const headers = ["description", "amount", "date"];
  const lines = [headers.join(",")];

  for (const r of rows) {
    // Escape quotes in description
    const desc = `"${r.description.replace(/"/g, '""')}"`;
    lines.push([desc, r.amount, r.date].join(","));
  }

  return lines.join("\n");
}

// Trigger client-side browser download for converted CSV file
export function triggerCsvDownload(csvContent: string, filename: string = "converted-statement.csv") {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
