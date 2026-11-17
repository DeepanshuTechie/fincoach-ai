/**
 * SmartColumnDetector
 * Identifies transaction columns across SBI, HDFC, ICICI, Axis, PNB, Kotak, and custom bank statements.
 */

export interface DetectedColumns {
  dateKey: string | null;
  valueDateKey: string | null;
  descriptionKey: string | null;
  debitKey: string | null;
  creditKey: string | null;
  amountKey: string | null;
  typeKey: string | null; // DR / CR indicator column
  balanceKey: string | null;
  referenceKey: string | null;
  headerRowIndex: number;
  confidence: number;
  unmappedColumns: string[];
}

const DATE_SYNONYMS = [
  "date",
  "txn date",
  "txndate",
  "txn_date",
  "transaction date",
  "transaction_date",
  "trans date",
  "posting date",
  "post date",
  "booking date",
  "dated",
  "trans_date",
];

const VALUE_DATE_SYNONYMS = [
  "value date",
  "value_date",
  "val date",
  "val_date",
  "effective date",
  "value dt",
];

const DESCRIPTION_SYNONYMS = [
  "narration",
  "particulars",
  "transaction particulars",
  "description",
  "transaction details",
  "transaction_details",
  "remarks",
  "detail",
  "details",
  "merchant",
  "payee",
  "desc",
  "tran details",
  "narrative",
  "memo",
  "transaction description",
];

const DEBIT_SYNONYMS = [
  "debit",
  "debit amount",
  "debit amt",
  "debit(inr)",
  "dr",
  "dr amount",
  "dr amt",
  "dr.",
  "withdrawal",
  "withdrawals",
  "withdrawal amount",
  "withdrawal(inr)",
  "payments",
  "debits",
  "spent",
  "withdrawn",
  "paid out",
];

const CREDIT_SYNONYMS = [
  "credit",
  "credit amount",
  "credit amt",
  "credit(inr)",
  "cr",
  "cr amount",
  "cr amt",
  "cr.",
  "deposit",
  "deposits",
  "deposit amount",
  "deposit(inr)",
  "receipts",
  "credits",
  "received",
  "paid in",
];

const BALANCE_SYNONYMS = [
  "balance",
  "closing balance",
  "closing bal",
  "running balance",
  "available balance",
  "account balance",
  "bal",
  "net balance",
  "balance(inr)",
  "bal(inr)",
];

const REFERENCE_SYNONYMS = [
  "chq/ref no",
  "chq/ref number",
  "ref no",
  "ref number",
  "reference number",
  "reference no",
  "cheque no",
  "cheque number",
  "chq no",
  "utr",
  "utr number",
  "transaction id",
  "txn id",
  "ref/chq no",
];

const AMOUNT_SYNONYMS = ["amount", "txn amount", "transaction amount", "amount(inr)", "total amount"];

const TYPE_SYNONYMS = ["type", "cr/dr", "dr/cr", "cr_dr", "dr_cr", "d/c", "c/d", "trans type", "txn type"];

function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Score how well a raw header matches a list of synonyms (0 to 1)
 */
function scoreMatch(rawHeader: string, synonyms: string[]): number {
  const norm = normalizeHeader(rawHeader);
  if (!norm) return 0;

  for (const s of synonyms) {
    if (norm === s) return 1.0; // exact match
    if (norm.startsWith(s + " ") || norm.endsWith(" " + s)) return 0.9;
    if (norm.includes(s)) return 0.8;
  }
  return 0;
}

/**
 * Finds the most likely header row in multi-row bank spreadsheets (where rows 0-10 contain metadata)
 */
export function findHeaderRow(rows: unknown[][]): { headerIndex: number; headers: string[] } {
  let bestIndex = 0;
  let bestScore = -1;
  let bestHeaders: string[] = [];

  // Inspect the first 25 rows
  const limit = Math.min(rows.length, 25);

  for (let r = 0; r < limit; r++) {
    const row = rows[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    const stringCells = row.map((cell) => String(cell ?? "").trim());
    let rowScore = 0;
    let matchedKeywords = 0;

    for (const cell of stringCells) {
      if (!cell || cell.length > 50) continue;
      const isDate = scoreMatch(cell, DATE_SYNONYMS);
      const isDesc = scoreMatch(cell, DESCRIPTION_SYNONYMS);
      const isDebit = scoreMatch(cell, DEBIT_SYNONYMS);
      const isCredit = scoreMatch(cell, CREDIT_SYNONYMS);
      const isBal = scoreMatch(cell, BALANCE_SYNONYMS);
      const isAmt = scoreMatch(cell, AMOUNT_SYNONYMS);

      const maxCellScore = Math.max(isDate, isDesc, isDebit, isCredit, isBal, isAmt);
      if (maxCellScore > 0.6) {
        rowScore += maxCellScore;
        matchedKeywords++;
      }
    }

    // A genuine bank header row must have at least 2 distinct financial columns
    if (matchedKeywords >= 2 && rowScore > bestScore) {
      bestScore = rowScore;
      bestIndex = r;
      bestHeaders = stringCells;
    }
  }

  // If no high-confidence header found, default to first non-empty row
  if (bestScore <= 0 && rows.length > 0) {
    bestIndex = 0;
    bestHeaders = (rows[0] || []).map((c) => String(c ?? "").trim());
  }

  return { headerIndex: bestIndex, headers: bestHeaders };
}

/**
 * Maps raw table headers to standard financial fields
 */
export function detectColumns(headers: string[], headerRowIndex: number = 0): DetectedColumns {
  const result: DetectedColumns = {
    dateKey: null,
    valueDateKey: null,
    descriptionKey: null,
    debitKey: null,
    creditKey: null,
    amountKey: null,
    typeKey: null,
    balanceKey: null,
    referenceKey: null,
    headerRowIndex,
    confidence: 0,
    unmappedColumns: [],
  };

  const usedIndexes = new Set<number>();

  function pickBest(synonyms: string[]): { key: string | null; index: number } {
    let highest = 0;
    let bestKey: string | null = null;
    let bestIdx = -1;

    headers.forEach((h, idx) => {
      if (usedIndexes.has(idx)) return;
      const s = scoreMatch(h, synonyms);
      if (s > highest) {
        highest = s;
        bestKey = h;
        bestIdx = idx;
      }
    });

    if (highest >= 0.7 && bestIdx !== -1) {
      usedIndexes.add(bestIdx);
      return { key: bestKey, index: bestIdx };
    }
    return { key: null, index: -1 };
  }

  // Priority detection order
  result.valueDateKey = pickBest(VALUE_DATE_SYNONYMS).key;
  result.dateKey = pickBest(DATE_SYNONYMS).key;
  result.descriptionKey = pickBest(DESCRIPTION_SYNONYMS).key;
  result.debitKey = pickBest(DEBIT_SYNONYMS).key;
  result.creditKey = pickBest(CREDIT_SYNONYMS).key;
  result.balanceKey = pickBest(BALANCE_SYNONYMS).key;
  result.referenceKey = pickBest(REFERENCE_SYNONYMS).key;
  result.typeKey = pickBest(TYPE_SYNONYMS).key;
  result.amountKey = pickBest(AMOUNT_SYNONYMS).key;

  // Unmapped columns
  headers.forEach((h, idx) => {
    if (!usedIndexes.has(idx) && h.trim()) {
      result.unmappedColumns.push(h);
    }
  });

  // Calculate detection confidence
  let points = 0;
  if (result.dateKey) points += 30;
  if (result.descriptionKey) points += 30;
  if (result.debitKey && result.creditKey) points += 30;
  else if (result.amountKey) points += 20;
  if (result.balanceKey) points += 10;

  result.confidence = Math.min(points / 100, 1.0);

  return result;
}
