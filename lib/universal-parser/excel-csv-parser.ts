import * as XLSX from "xlsx";
import Papa from "papaparse";
import { findHeaderRow, detectColumns } from "./column-detector";
import { normalizeTransaction } from "./normalizer";
import { validateStatement } from "./statement-validator";
import { UniversalStatementParseResult, StatementMetadata } from "./types";

/**
 * Heuristically detects the Bank Name from statement headers or first 20 rows
 */
export function detectBankName(rows: unknown[][]): string {
  const text = rows
    .slice(0, 15)
    .map((r) => (Array.isArray(r) ? r.join(" ") : String(r)))
    .join(" ")
    .toUpperCase();

  if (text.includes("STATE BANK OF INDIA") || text.includes("SBI")) return "State Bank of India (SBI)";
  if (text.includes("HDFC BANK")) return "HDFC Bank";
  if (text.includes("ICICI BANK")) return "ICICI Bank";
  if (text.includes("AXIS BANK")) return "Axis Bank";
  if (text.includes("PUNJAB NATIONAL BANK") || text.includes("PNB")) return "Punjab National Bank (PNB)";
  if (text.includes("KOTAK MAHINDRA") || text.includes("KOTAK")) return "Kotak Mahindra Bank";
  if (text.includes("BANK OF BARODA") || text.includes("BOB")) return "Bank of Baroda";
  if (text.includes("CANARA BANK")) return "Canara Bank";
  if (text.includes("UNION BANK OF INDIA")) return "Union Bank of India";
  if (text.includes("INDUSIND BANK")) return "IndusInd Bank";
  if (text.includes("IDFC FIRST") || text.includes("IDFC")) return "IDFC FIRST Bank";
  if (text.includes("YES BANK")) return "Yes Bank";

  return "Standard Universal Format";
}

/**
 * Parses Excel (.xlsx, .xls) buffer into Standardized Universal Transactions
 */
export function parseExcelStatement(
  buffer: ArrayBuffer | Uint8Array,
  fileName: string = "statement.xlsx"
): UniversalStatementParseResult {
  try {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return {
        success: false,
        metadata: {
          file_name: fileName,
          file_size_bytes: buffer.byteLength,
          detected_file_type: "xlsx",
          currency: "INR",
        },
        transactions: [],
        validation: {
          total_transactions: 0,
          verified_count: 0,
          warning_count: 0,
          error_count: 0,
          total_debit: 0,
          total_credit: 0,
          net_cashflow: 0,
          opening_balance: null,
          closing_balance: null,
          calculated_closing_balance: null,
          balance_reconciled: false,
          reconciliation_difference: null,
          duplicate_count: 0,
          extraction_confidence: 0,
          validation_issues: ["Excel workbook contains no sheets."],
        },
        error: "Excel spreadsheet is empty or has no active worksheets.",
      };
    }

    const worksheet = workbook.Sheets[sheetName];
    // Convert sheet to 2D array of rows
    const raw2D: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    if (raw2D.length === 0) {
      return {
        success: false,
        metadata: {
          file_name: fileName,
          file_size_bytes: buffer.byteLength,
          detected_file_type: "xlsx",
          currency: "INR",
        },
        transactions: [],
        validation: {
          total_transactions: 0,
          verified_count: 0,
          warning_count: 0,
          error_count: 0,
          total_debit: 0,
          total_credit: 0,
          net_cashflow: 0,
          opening_balance: null,
          closing_balance: null,
          calculated_closing_balance: null,
          balance_reconciled: false,
          reconciliation_difference: null,
          duplicate_count: 0,
          extraction_confidence: 0,
          validation_issues: ["Worksheet contains no row data."],
        },
        error: "Worksheet contains no data rows.",
      };
    }

    const bankName = detectBankName(raw2D);
    const { headerIndex, headers } = findHeaderRow(raw2D);
    const detected = detectColumns(headers, headerIndex);

    const transactions = [];
    const dataRows = raw2D.slice(headerIndex + 1);

    for (let r = 0; r < dataRows.length; r++) {
      const rowArr = dataRows[r];
      if (!Array.isArray(rowArr) || rowArr.length === 0) continue;

      // Map row array into key-value map using headers
      const rowMap: Record<string, unknown> = {};
      headers.forEach((h, idx) => {
        if (h) rowMap[h] = rowArr[idx];
      });

      const rawDate = detected.dateKey ? rowMap[detected.dateKey] : undefined;
      const rawValueDate = detected.valueDateKey ? rowMap[detected.valueDateKey] : undefined;
      const rawDesc = detected.descriptionKey ? rowMap[detected.descriptionKey] : undefined;
      const rawDebit = detected.debitKey ? rowMap[detected.debitKey] : undefined;
      const rawCredit = detected.creditKey ? rowMap[detected.creditKey] : undefined;
      const rawAmount = detected.amountKey ? rowMap[detected.amountKey] : undefined;
      const rawType = detected.typeKey ? rowMap[detected.typeKey] : undefined;
      const rawBal = detected.balanceKey ? rowMap[detected.balanceKey] : undefined;
      const rawRef = detected.referenceKey ? rowMap[detected.referenceKey] : undefined;

      // Skip completely empty spacer rows or trailing footers
      if (!rawDate && !rawDesc && !rawDebit && !rawCredit && !rawAmount) continue;

      const txn = normalizeTransaction({
        rawDate,
        rawValueDate,
        rawDescription: rawDesc,
        rawDebit,
        rawCredit,
        rawAmount,
        rawType,
        rawBalance: rawBal,
        rawReference: rawRef,
        sourceRow: headerIndex + 1 + r + 1,
      });

      // Filter out footer rows disguised as transactions (e.g. "Total Withdrawals: 50,000")
      const lowerDesc = txn.description.toLowerCase();
      if (
        lowerDesc.includes("opening balance") ||
        lowerDesc.includes("closing balance") ||
        lowerDesc.includes("total debit") ||
        lowerDesc.includes("total credit") ||
        lowerDesc.includes("grand total")
      ) {
        continue;
      }

      transactions.push(txn);
    }

    const metadata: StatementMetadata = {
      bank_name: bankName,
      file_name: fileName,
      file_size_bytes: buffer.byteLength,
      detected_file_type: fileName.toLowerCase().endsWith(".xls") ? "xls" : "xlsx",
      currency: "INR",
      transaction_count: transactions.length,
      statement_period: {
        start_date: transactions.length > 0 ? transactions[0].date : null,
        end_date: transactions.length > 0 ? transactions[transactions.length - 1].date : null,
      },
    };

    const { validation, validatedTransactions } = validateStatement(transactions, metadata);

    return {
      success: validatedTransactions.length > 0,
      metadata: {
        ...metadata,
        opening_balance: validation.opening_balance,
        closing_balance: validation.closing_balance,
        total_debit: validation.total_debit,
        total_credit: validation.total_credit,
      },
      transactions: validatedTransactions,
      validation,
      detected_columns: {
        date_column: detected.dateKey || undefined,
        description_column: detected.descriptionKey || undefined,
        debit_column: detected.debitKey || undefined,
        credit_column: detected.creditKey || undefined,
        balance_column: detected.balanceKey || undefined,
        type_column: detected.typeKey || undefined,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to parse Excel statement";
    return {
      success: false,
      metadata: {
        file_name: fileName,
        file_size_bytes: buffer.byteLength,
        detected_file_type: "xlsx",
        currency: "INR",
      },
      transactions: [],
      validation: {
        total_transactions: 0,
        verified_count: 0,
        warning_count: 0,
        error_count: 0,
        total_debit: 0,
        total_credit: 0,
        net_cashflow: 0,
        opening_balance: null,
        closing_balance: null,
        calculated_closing_balance: null,
        balance_reconciled: false,
        reconciliation_difference: null,
        duplicate_count: 0,
        extraction_confidence: 0,
        validation_issues: [msg],
      },
      error: msg,
    };
  }
}

/**
 * Parses CSV / TSV / TXT text or buffer into Standardized Universal Transactions
 */
export function parseCsvStatement(
  csvContent: string,
  fileName: string = "statement.csv"
): UniversalStatementParseResult {
  try {
    const parsed = Papa.parse<unknown[]>(csvContent, {
      skipEmptyLines: "greedy",
      dynamicTyping: false,
    });

    const raw2D = parsed.data;
    if (!raw2D || raw2D.length === 0) {
      return {
        success: false,
        metadata: {
          file_name: fileName,
          file_size_bytes: csvContent.length,
          detected_file_type: "csv",
          currency: "INR",
        },
        transactions: [],
        validation: {
          total_transactions: 0,
          verified_count: 0,
          warning_count: 0,
          error_count: 0,
          total_debit: 0,
          total_credit: 0,
          net_cashflow: 0,
          opening_balance: null,
          closing_balance: null,
          calculated_closing_balance: null,
          balance_reconciled: false,
          reconciliation_difference: null,
          duplicate_count: 0,
          extraction_confidence: 0,
          validation_issues: ["CSV file contains no readable records."],
        },
        error: "CSV file is empty.",
      };
    }

    const bankName = detectBankName(raw2D);
    const { headerIndex, headers } = findHeaderRow(raw2D);
    const detected = detectColumns(headers, headerIndex);

    const transactions = [];
    const dataRows = raw2D.slice(headerIndex + 1);

    for (let r = 0; r < dataRows.length; r++) {
      const rowArr = dataRows[r];
      if (!Array.isArray(rowArr) || rowArr.length === 0) continue;

      const rowMap: Record<string, unknown> = {};
      headers.forEach((h, idx) => {
        if (h) rowMap[h] = rowArr[idx];
      });

      const rawDate = detected.dateKey ? rowMap[detected.dateKey] : undefined;
      const rawValueDate = detected.valueDateKey ? rowMap[detected.valueDateKey] : undefined;
      const rawDesc = detected.descriptionKey ? rowMap[detected.descriptionKey] : undefined;
      const rawDebit = detected.debitKey ? rowMap[detected.debitKey] : undefined;
      const rawCredit = detected.creditKey ? rowMap[detected.creditKey] : undefined;
      const rawAmount = detected.amountKey ? rowMap[detected.amountKey] : undefined;
      const rawType = detected.typeKey ? rowMap[detected.typeKey] : undefined;
      const rawBal = detected.balanceKey ? rowMap[detected.balanceKey] : undefined;
      const rawRef = detected.referenceKey ? rowMap[detected.referenceKey] : undefined;

      if (!rawDate && !rawDesc && !rawDebit && !rawCredit && !rawAmount) continue;

      const txn = normalizeTransaction({
        rawDate,
        rawValueDate,
        rawDescription: rawDesc,
        rawDebit,
        rawCredit,
        rawAmount,
        rawType,
        rawBalance: rawBal,
        rawReference: rawRef,
        sourceRow: headerIndex + 1 + r + 1,
      });

      const lowerDesc = txn.description.toLowerCase();
      if (
        lowerDesc.includes("opening balance") ||
        lowerDesc.includes("closing balance") ||
        lowerDesc.includes("total debit") ||
        lowerDesc.includes("total credit") ||
        lowerDesc.includes("grand total")
      ) {
        continue;
      }

      transactions.push(txn);
    }

    const metadata: StatementMetadata = {
      bank_name: bankName,
      file_name: fileName,
      file_size_bytes: csvContent.length,
      detected_file_type: "csv",
      currency: "INR",
      transaction_count: transactions.length,
      statement_period: {
        start_date: transactions.length > 0 ? transactions[0].date : null,
        end_date: transactions.length > 0 ? transactions[transactions.length - 1].date : null,
      },
    };

    const { validation, validatedTransactions } = validateStatement(transactions, metadata);

    return {
      success: validatedTransactions.length > 0,
      metadata: {
        ...metadata,
        opening_balance: validation.opening_balance,
        closing_balance: validation.closing_balance,
        total_debit: validation.total_debit,
        total_credit: validation.total_credit,
      },
      transactions: validatedTransactions,
      validation,
      detected_columns: {
        date_column: detected.dateKey || undefined,
        description_column: detected.descriptionKey || undefined,
        debit_column: detected.debitKey || undefined,
        credit_column: detected.creditKey || undefined,
        balance_column: detected.balanceKey || undefined,
        type_column: detected.typeKey || undefined,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to parse CSV statement";
    return {
      success: false,
      metadata: {
        file_name: fileName,
        file_size_bytes: csvContent.length,
        detected_file_type: "csv",
        currency: "INR",
      },
      transactions: [],
      validation: {
        total_transactions: 0,
        verified_count: 0,
        warning_count: 0,
        error_count: 0,
        total_debit: 0,
        total_credit: 0,
        net_cashflow: 0,
        opening_balance: null,
        closing_balance: null,
        calculated_closing_balance: null,
        balance_reconciled: false,
        reconciliation_difference: null,
        duplicate_count: 0,
        extraction_confidence: 0,
        validation_issues: [msg],
      },
      error: msg,
    };
  }
}
