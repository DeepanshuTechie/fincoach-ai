import { detectFileType } from "./file-detector";
import { parseExcelStatement, parseCsvStatement } from "./excel-csv-parser";
import { extractStatementFromDocument } from "./pdf-ocr-extractor";
import { UniversalStatementParseResult } from "./types";

export * from "./types";
export * from "./file-detector";
export * from "./column-detector";
export * from "./normalizer";
export * from "./statement-validator";
export * from "./excel-csv-parser";
export * from "./pdf-ocr-extractor";
export * from "./fincoach-adapter";

/**
 * Universal Bank Statement Parser - Master Entrypoint
 * Automatically detects format (PDF, Excel, CSV, Image), routes to specialized parser,
 * normalizes columns, verifies math integrity, and returns clean standardized transactions.
 */
export async function parseBankStatement(
  buffer: Buffer | Uint8Array,
  fileName: string
): Promise<UniversalStatementParseResult> {
  // 1. File Type Detection via Magic Bytes
  const detected = detectFileType(buffer, fileName);

  if (!detected.isValid) {
    return {
      success: false,
      metadata: {
        file_name: fileName,
        file_size_bytes: buffer.byteLength,
        detected_file_type: detected.fileType,
        is_password_protected: detected.isPasswordProtected,
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
        validation_issues: [detected.errorMessage || "Unsupported or invalid file."],
      },
      error: detected.errorMessage,
    };
  }

  // 2. Route to specialized format extractor
  switch (detected.fileType) {
    case "xlsx":
    case "xls":
      return parseExcelStatement(buffer, fileName);

    case "csv": {
      const text = Buffer.from(buffer).toString("utf-8");
      return parseCsvStatement(text, fileName);
    }

    case "pdf":
    case "image":
    default:
      return extractStatementFromDocument(buffer, detected.mimeType, fileName);
  }
}
