/**
 * Universal Bank Statement Parser - Types & Schema
 * Standardized across Indian & International Banks
 */

export type SupportedFileType = "pdf" | "scanned_pdf" | "csv" | "xlsx" | "xls" | "image" | "unknown";

export type TransactionStatus = "verified" | "warning" | "error";

export interface UniversalTransaction {
  id: string;
  date: string; // ISO format: YYYY-MM-DD
  value_date?: string | null;
  description: string;
  debit: number;
  credit: number;
  balance: number | null;
  currency: string;
  reference_number?: string | null;
  payment_method?: string | null; // UPI, NEFT, IMPS, POS, ATM, ACH, CHEQUE, etc.
  merchant?: string | null;
  category?: string | null;
  status: TransactionStatus;
  confidence: number; // 0.0 - 1.0
  issues?: string[];
  source_page?: number | null;
  source_row?: number | null;
}

export interface StatementMetadata {
  bank_name?: string;
  account_number_masked?: string;
  account_type?: string;
  statement_period?: {
    start_date: string | null;
    end_date: string | null;
  };
  opening_balance?: number | null;
  closing_balance?: number | null;
  total_debit?: number;
  total_credit?: number;
  transaction_count?: number;
  currency: string;
  detected_file_type: SupportedFileType;
  file_name: string;
  file_size_bytes: number;
  is_password_protected?: boolean;
}

export interface ValidationSummary {
  total_transactions: number;
  verified_count: number;
  warning_count: number;
  error_count: number;
  total_debit: number;
  total_credit: number;
  net_cashflow: number;
  opening_balance: number | null;
  closing_balance: number | null;
  calculated_closing_balance: number | null;
  balance_reconciled: boolean;
  reconciliation_difference: number | null;
  duplicate_count: number;
  extraction_confidence: number; // Overall statement confidence 0.0 - 1.0
  validation_issues: string[];
}

export interface UniversalStatementParseResult {
  success: boolean;
  metadata: StatementMetadata;
  transactions: UniversalTransaction[];
  validation: ValidationSummary;
  detected_columns?: {
    date_column?: string;
    description_column?: string;
    debit_column?: string;
    credit_column?: string;
    balance_column?: string;
    type_column?: string;
  };
  error?: string;
  raw_warnings?: string[];
}
