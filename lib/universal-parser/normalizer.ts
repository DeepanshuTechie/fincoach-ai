import { UniversalTransaction, TransactionStatus } from "./types";

/**
 * Universal Transaction Normalizer
 * Standardizes bank row data into the strict FinCoach Universal JSON Schema.
 */

// Month name lookup for Indian statement text dates (e.g. "15-Aug-2026")
const MONTH_MAP: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
};

/**
 * Parses raw bank currency/amount strings into a clean floating point number
 * Accurately parses:
 * - ₹1,50,000.00 (Indian lakh notation)
 * - 1,500.00
 * - 1500 DR / 1500 CR
 * - (1,500.00) / -1,500.00
 */
export function parseAmount(val: unknown): { amount: number; isDr?: boolean; isCr?: boolean } {
  if (val === null || val === undefined) return { amount: 0 };
  if (typeof val === "number") {
    return { amount: Math.abs(val), isDr: val < 0, isCr: val > 0 };
  }

  const raw = String(val).trim();
  if (!raw || raw === "-" || raw === "--" || raw === "Nil" || raw === "NIL") {
    return { amount: 0 };
  }

  const upper = raw.toUpperCase();
  const isDr = upper.includes("DR") || upper.startsWith("-") || (upper.startsWith("(") && upper.endsWith(")"));
  const isCr = upper.includes("CR") && !isDr;

  // Remove currency symbols, commas, DR/CR, parentheses
  const clean = upper
    .replace(/[₹$,\s]/g, "")
    .replace(/\bDR\b|\bCR\b/g, "")
    .replace(/[()]/g, "");

  const num = parseFloat(clean);
  if (isNaN(num)) return { amount: 0 };

  return {
    amount: Math.round(Math.abs(num) * 100) / 100,
    isDr,
    isCr,
  };
}

/**
 * Converts Indian and international banking date strings into strict ISO YYYY-MM-DD
 */
export function normalizeDate(raw: unknown): string | null {
  if (!raw) return null;
  const str = String(raw).trim();
  if (!str) return null;

  // 1. Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // 2. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    let year = dmyMatch[3];
    if (year.length === 2) year = (parseInt(year, 10) > 70 ? "19" : "20") + year;
    // Validate day & month range
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      return `${year}-${month}-${day}`;
    }
  }

  // 3. DD-MMM-YYYY or DD MMM YYYY (e.g. 15-Nov-2026 or 05 Jul 26)
  const textMonthMatch = str.match(/^(\d{1,2})[\s\-\/]([A-Za-z]{3,9})[\s\-\/](\d{2,4})/);
  if (textMonthMatch) {
    const day = textMonthMatch[1].padStart(2, "0");
    const monStr = textMonthMatch[2].toLowerCase();
    let year = textMonthMatch[3];
    if (year.length === 2) year = (parseInt(year, 10) > 70 ? "19" : "20") + year;
    const month = MONTH_MAP[monStr];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // 4. Excel Serial Date number (e.g. 45620)
  if (/^\d{5}$/.test(str)) {
    const serial = parseInt(str, 10);
    // Excel base date: Dec 30, 1899
    const utcDays = Math.floor(serial - 25569);
    const dateObj = new Date(utcDays * 86400 * 1000);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split("T")[0];
    }
  }

  // 5. Native Date Parser fallback
  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  } catch (_) {}

  return null;
}

/**
 * Extracts payment method heuristics from bank transaction narrative
 */
export function detectPaymentMethod(description: string): string {
  const d = (description || "").toUpperCase();
  if (d.includes("UPI") || d.includes("/UPI/") || d.includes("@OK") || d.includes("@PAYTM") || d.includes("@YBL")) {
    return "UPI";
  }
  if (d.includes("NEFT")) return "NEFT";
  if (d.includes("IMPS")) return "IMPS";
  if (d.includes("RTGS")) return "RTGS";
  if (d.includes("POS") || d.includes("DEBIT CARD") || d.includes("SWIPE")) return "POS";
  if (d.includes("ATM") || d.includes("CASH WDL")) return "ATM";
  if (d.includes("ACH") || d.includes("NACH") || d.includes("MANDATE")) return "ACH";
  if (d.includes("CHQ") || d.includes("CHEQUE")) return "CHEQUE";
  if (d.includes("INTEREST") || d.includes("INT.PD")) return "INTEREST";
  if (d.includes("SALARY") || d.includes("SAL/")) return "SALARY";
  return "TRANSFER";
}

/**
 * Normalizes a raw transaction record into the strict Universal Transaction Schema
 */
export function normalizeTransaction(params: {
  rawDate: unknown;
  rawValueDate?: unknown;
  rawDescription: unknown;
  rawDebit?: unknown;
  rawCredit?: unknown;
  rawAmount?: unknown;
  rawType?: unknown;
  rawBalance?: unknown;
  rawReference?: unknown;
  sourceRow?: number;
  sourcePage?: number;
}): UniversalTransaction {
  const date = normalizeDate(params.rawDate) || new Date().toISOString().split("T")[0];
  const valueDate = params.rawValueDate ? normalizeDate(params.rawValueDate) : null;
  const description = String(params.rawDescription || "").trim() || "Unspecified Bank Transaction";

  let debit = 0;
  let credit = 0;
  const issues: string[] = [];

  // Case 1: Separate Debit and Credit columns provided
  if (params.rawDebit !== undefined && params.rawCredit !== undefined) {
    debit = parseAmount(params.rawDebit).amount;
    credit = parseAmount(params.rawCredit).amount;
  }
  // Case 2: Only single Amount column provided + Type indicator
  else if (params.rawAmount !== undefined) {
    const parsedAmt = parseAmount(params.rawAmount);
    const typeStr = String(params.rawType || "").toUpperCase();

    if (parsedAmt.isDr || typeStr.includes("DR") || typeStr.includes("D") || typeStr.includes("DEBIT")) {
      debit = parsedAmt.amount;
    } else if (parsedAmt.isCr || typeStr.includes("CR") || typeStr.includes("C") || typeStr.includes("CREDIT")) {
      credit = parsedAmt.amount;
    } else {
      // Default single amount without indicator is classified as debit (standard Indian expense convention)
      debit = parsedAmt.amount;
      issues.push("Amount type not explicitly marked DR/CR; assumed debit outflow.");
    }
  }

  // Parse running balance if present
  let balance: number | null = null;
  if (params.rawBalance !== undefined && params.rawBalance !== null && params.rawBalance !== "") {
    const balResult = parseAmount(params.rawBalance);
    balance = balResult.isDr ? -balResult.amount : balResult.amount;
  }

  // Determine status & confidence
  let status: TransactionStatus = "verified";
  let confidence = 0.95;

  if (!normalizeDate(params.rawDate)) {
    status = "warning";
    confidence -= 0.3;
    issues.push("Date format could not be verified with 100% certainty.");
  }

  if (debit === 0 && credit === 0) {
    status = "error";
    confidence -= 0.5;
    issues.push("Both debit and credit amounts are zero or unreadable.");
  }

  const paymentMethod = detectPaymentMethod(description);
  const referenceNumber = params.rawReference ? String(params.rawReference).trim() : null;

  const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return {
    id,
    date,
    value_date: valueDate,
    description,
    debit,
    credit,
    balance,
    currency: "INR",
    reference_number: referenceNumber,
    payment_method: paymentMethod,
    merchant: null,
    category: null,
    status,
    confidence: Math.max(0.1, Math.min(1.0, confidence)),
    issues: issues.length > 0 ? issues : undefined,
    source_row: params.sourceRow,
    source_page: params.sourcePage,
  };
}
