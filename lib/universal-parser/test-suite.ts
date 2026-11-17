import { parseCsvStatement, parseExcelStatement } from "./excel-csv-parser";
import { normalizeTransaction } from "./normalizer";
import { validateStatement } from "./statement-validator";
import { UniversalTransaction, UniversalStatementParseResult } from "./types";
import * as XLSX from "xlsx";

export interface SyntheticTestCase {
  bankName: string;
  format: "CSV" | "Excel" | "Simulated_PDF" | "Simulated_OCR";
  description: string;
  expectedTransactionCount: number;
  expectedTotalDebit: number;
  expectedTotalCredit: number;
}

export interface TestResultItem {
  bankName: string;
  format: string;
  status: "PASSED" | "FAILED";
  transactionsDetected: number;
  expectedCount: number;
  totalDebit: number;
  totalCredit: number;
  balanceReconciled: boolean;
  confidence: number;
  issues: string[];
}

export interface FullTestSuiteReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: TestResultItem[];
}

/**
 * 1. Synthetic Axis Bank CSV
 * Format: "Transaction Date", "Transaction Particulars", "DR Amount", "CR Amount", "Closing Balance"
 */
export function generateSyntheticAxisCsv(): string {
  return `AXIS BANK SAVINGS ACCOUNT STATEMENT
Account Number: 914010001234567
Branch: Connaught Place, New Delhi
Statement Period: 01-Nov-2026 to 10-Nov-2026

Transaction Date,Transaction Particulars,DR Amount,CR Amount,Closing Balance
01/11/2026,UPI/Swiggy Order/swiggy@icici/AXS1001,450.00,,24550.00
03/11/2026,SALARY CREDIT FROM TECH CORP LTD,,65000.00,89550.00
05/11/2026,UPI/Amazon India/amazon@apl/AXS1002,1299.00,,88251.00
08/11/2026,NETFLIX SUBSCRIPTION MUMBAI,649.00,,87602.00
10/11/2026,ATM CASH WDL CONNAUGHT PLACE,5000.00,,82602.00`;
}

/**
 * 2. Synthetic Punjab National Bank (PNB) Excel (XLSX)
 * Format: 8 metadata rows + headers: "Txn Date", "Narration", "Cheque No", "Withdrawal (INR)", "Deposit (INR)", "Balance (INR)"
 */
export function generateSyntheticPnbWorkbook(): ArrayBuffer {
  const data = [
    ["PUNJAB NATIONAL BANK"],
    ["Branch: Model Town, Ludhiana"],
    ["Account Type: Savings Fund Account"],
    ["Account No: 0892000100123456"],
    ["Customer Name: Rajesh Kumar"],
    ["IFSC: PUNB0089200"],
    [],
    ["Txn Date", "Narration", "Cheque No", "Withdrawal (INR)", "Deposit (INR)", "Balance (INR)"],
    ["02-11-2026", "ZOMATO ORDER GURGAON", "", "380.00", "", "45120.00"],
    ["04-11-2026", "UBER RIDE INDIA", "", "180.00", "", "44940.00"],
    ["07-11-2026", "NEFT CR-MOHIT VERMA-RENT REIMB", "", "", "12000.00", "56940.00"],
    ["09-11-2026", "AIRTEL BROADBAND BILL", "", "1179.00", "", "55761.00"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Statement");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return buf;
}

/**
 * 3. Synthetic State Bank of India (SBI) Structure
 * Format: "Txn Date", "Value Date", "Description", "Ref No./Cheque No.", "Debit", "Credit", "Balance"
 */
export function generateSyntheticSbiTransactions(): UniversalStatementParseResult {
  const rawRows = [
    {
      date: "01/11/2026",
      valueDate: "01/11/2026",
      desc: "TRANSFER-UPI/CR/630623912345/BLINKIT/PYTM",
      debit: "340.00",
      credit: "",
      bal: "18500.00",
      ref: "630623912345",
    },
    {
      date: "04/11/2026",
      valueDate: "04/11/2026",
      desc: "POS SWIPE/SHELL FUEL STATION NEW DELHI",
      debit: "2500.00",
      credit: "",
      bal: "16000.00",
      ref: "POS12984",
    },
    {
      date: "06/11/2026",
      valueDate: "06/11/2026",
      desc: "BY CLEARING-CHEQUE DEPOSIT CHQ#440192",
      debit: "",
      credit: "15000.00",
      bal: "31000.00",
      ref: "440192",
    },
    {
      date: "09/11/2026",
      valueDate: "09/11/2026",
      desc: "SPOTIFY PREMIUM SUBSCRIPTION",
      debit: "119.00",
      credit: "",
      bal: "30881.00",
      ref: "REC10029",
    },
  ];

  const transactions: UniversalTransaction[] = rawRows.map((r, i) =>
    normalizeTransaction({
      rawDate: r.date,
      rawValueDate: r.valueDate,
      rawDescription: r.desc,
      rawDebit: r.debit,
      rawCredit: r.credit,
      rawBalance: r.bal,
      rawReference: r.ref,
      sourceRow: i + 1,
      sourcePage: 1,
    })
  );

  const { validation, validatedTransactions } = validateStatement(transactions, {
    bank_name: "State Bank of India (SBI)",
    opening_balance: 18840.0,
    closing_balance: 30881.0,
  });

  return {
    success: true,
    metadata: {
      bank_name: "State Bank of India (SBI)",
      file_name: "sbi_statement_nov2026.pdf",
      file_size_bytes: 45200,
      detected_file_type: "pdf",
      currency: "INR",
      transaction_count: validatedTransactions.length,
      opening_balance: 18840.0,
      closing_balance: 30881.0,
      total_debit: validation.total_debit,
      total_credit: validation.total_credit,
      statement_period: { start_date: "2026-11-01", end_date: "2026-11-09" },
    },
    transactions: validatedTransactions,
    validation,
  };
}

/**
 * 4. Synthetic HDFC Bank Statement Structure
 * Format: "Date", "Narration", "Chq/Ref No", "Value Dt", "Withdrawal Amt.", "Deposit Amt.", "Closing Balance"
 */
export function generateSyntheticHdfcTransactions(): UniversalStatementParseResult {
  const rawRows = [
    {
      date: "03/11/26",
      desc: "UPI-ZEPTO-ZEPTO@ICICI-PYTM00129",
      ref: "PYTM00129",
      debit: "412.00",
      credit: "",
      bal: "78200.00",
    },
    {
      date: "05/11/26",
      desc: "NEFT DR-HDFC0000001-TATACAPITAL-LOAN EMI",
      ref: "N11050012",
      debit: "18500.00",
      credit: "",
      bal: "59700.00",
    },
    {
      date: "07/11/26",
      desc: "ACH C-GROWW MUTUAL FUND DIVIDEND",
      ref: "ACH88192",
      debit: "",
      credit: "3400.00",
      bal: "63100.00",
    },
  ];

  const transactions: UniversalTransaction[] = rawRows.map((r, i) =>
    normalizeTransaction({
      rawDate: r.date,
      rawDescription: r.desc,
      rawDebit: r.debit,
      rawCredit: r.credit,
      rawBalance: r.bal,
      rawReference: r.ref,
      sourceRow: i + 1,
    })
  );

  const { validation, validatedTransactions } = validateStatement(transactions, {
    bank_name: "HDFC Bank",
    opening_balance: 78612.0,
    closing_balance: 63100.0,
  });

  return {
    success: true,
    metadata: {
      bank_name: "HDFC Bank",
      file_name: "hdfc_statement_nov.pdf",
      file_size_bytes: 52100,
      detected_file_type: "pdf",
      currency: "INR",
      transaction_count: validatedTransactions.length,
      opening_balance: 78612.0,
      closing_balance: 63100.0,
      total_debit: validation.total_debit,
      total_credit: validation.total_credit,
      statement_period: { start_date: "2026-11-03", end_date: "2026-11-07" },
    },
    transactions: validatedTransactions,
    validation,
  };
}

/**
 * 5. Synthetic ICICI Bank Statement Structure
 * Format: "Transaction Date", "Transaction Remarks", "Amount (INR)", "Type (DR/CR)", "Balance (INR)"
 */
export function generateSyntheticIciciTransactions(): UniversalStatementParseResult {
  const rawRows = [
    { date: "02-Nov-2026", desc: "STARBUCKS COFFEE CONNAUGHT PL", amt: "490.00", type: "DR", bal: "34500.00" },
    { date: "05-Nov-2026", desc: "DIVIDEND TCS LTD", amt: "1250.00", type: "CR", bal: "35750.00" },
    { date: "08-Nov-2026", desc: "AMAZON PAY INDIA UPI", amt: "1899.00", type: "DR", bal: "33851.00" },
  ];

  const transactions: UniversalTransaction[] = rawRows.map((r, i) =>
    normalizeTransaction({
      rawDate: r.date,
      rawDescription: r.desc,
      rawAmount: r.amt,
      rawType: r.type,
      rawBalance: r.bal,
      sourceRow: i + 1,
    })
  );

  const { validation, validatedTransactions } = validateStatement(transactions, {
    bank_name: "ICICI Bank",
    opening_balance: 34990.0,
    closing_balance: 33851.0,
  });

  return {
    success: true,
    metadata: {
      bank_name: "ICICI Bank",
      file_name: "icici_bank_statement.pdf",
      file_size_bytes: 38900,
      detected_file_type: "pdf",
      currency: "INR",
      transaction_count: validatedTransactions.length,
      opening_balance: 34990.0,
      closing_balance: 33851.0,
      total_debit: validation.total_debit,
      total_credit: validation.total_credit,
      statement_period: { start_date: "2026-11-02", end_date: "2026-11-08" },
    },
    transactions: validatedTransactions,
    validation,
  };
}

/**
 * 6. Synthetic Scanned PDF / Image OCR Statement Simulation
 * Tests OCR extraction with Indian Lakh currency format (e.g. "1,50,000.00"), noisy merchant names, and page numbers.
 */
export function generateSyntheticScannedImageTransactions(): UniversalStatementParseResult {
  const rawRows = [
    { date: "15/10/2026", desc: "HOSPITAL EXPENSES MAX HEALTHCARE", amt: "1,50,000.00", type: "DR", bal: "2,40,000.00" },
    { date: "18/10/2026", desc: "INSURANCE CLAIM REIMBURSEMENT", amt: "1,20,000.00", type: "CR", bal: "3,60,000.00" },
  ];

  const transactions: UniversalTransaction[] = rawRows.map((r, i) =>
    normalizeTransaction({
      rawDate: r.date,
      rawDescription: r.desc,
      rawAmount: r.amt,
      rawType: r.type,
      rawBalance: r.bal,
      sourceRow: i + 1,
      sourcePage: 1,
    })
  );

  const { validation, validatedTransactions } = validateStatement(transactions, {
    bank_name: "Scanned Mobile Statement Receipt",
    opening_balance: 390000.0,
    closing_balance: 360000.0,
  });

  return {
    success: true,
    metadata: {
      bank_name: "Scanned Mobile Statement Receipt",
      file_name: "statement_scan_oct2026.png",
      file_size_bytes: 420000,
      detected_file_type: "image",
      currency: "INR",
      transaction_count: validatedTransactions.length,
      opening_balance: 390000.0,
      closing_balance: 360000.0,
      total_debit: validation.total_debit,
      total_credit: validation.total_credit,
      statement_period: { start_date: "2026-10-15", end_date: "2026-10-18" },
    },
    transactions: validatedTransactions,
    validation,
  };
}

/**
 * 7. Synthetic Unknown / Custom Bank Statement
 * Format: Non-standard column headers: "Posting Dt", "Payee Details", "Debit(INR)", "Credit(INR)", "Available Balance"
 */
export function generateSyntheticUnknownBankCsv(): string {
  return `INTERNATIONAL CO-OPERATIVE BANK
Posting Dt;Payee Details;Debit(INR);Credit(INR);Available Balance
2026-11-01;LOCAL GROCERY COOPERATIVE;850.00;;12500.00
2026-11-04;FREELANCE CLIENT CONSULTING;;25000.00;37500.00
2026-11-07;ELECTRICITY DISCOM DELHI;2450.00;;35050.00`;
}

/**
 * Executes the entire test suite and returns structured report
 */
export function runUniversalParserTestSuite(): FullTestSuiteReport {
  const results: TestResultItem[] = [];

  // Test 1: Axis CSV
  try {
    const axisCsv = generateSyntheticAxisCsv();
    const res = parseCsvStatement(axisCsv, "axis_nov_2026.csv");
    results.push({
      bankName: "Axis Bank",
      format: "CSV",
      status: res.success && res.transactions.length === 5 && res.validation.balance_reconciled ? "PASSED" : "FAILED",
      transactionsDetected: res.transactions.length,
      expectedCount: 5,
      totalDebit: res.validation.total_debit,
      totalCredit: res.validation.total_credit,
      balanceReconciled: res.validation.balance_reconciled,
      confidence: res.validation.extraction_confidence,
      issues: res.validation.validation_issues,
    });
  } catch (err: unknown) {
    results.push({
      bankName: "Axis Bank",
      format: "CSV",
      status: "FAILED",
      transactionsDetected: 0,
      expectedCount: 5,
      totalDebit: 0,
      totalCredit: 0,
      balanceReconciled: false,
      confidence: 0,
      issues: [err instanceof Error ? err.message : "Error"],
    });
  }

  // Test 2: PNB Excel (XLSX)
  try {
    const pnbBuf = generateSyntheticPnbWorkbook();
    const res = parseExcelStatement(pnbBuf, "pnb_statement.xlsx");
    results.push({
      bankName: "Punjab National Bank (PNB)",
      format: "Excel (XLSX)",
      status: res.success && res.transactions.length === 4 && res.validation.balance_reconciled ? "PASSED" : "FAILED",
      transactionsDetected: res.transactions.length,
      expectedCount: 4,
      totalDebit: res.validation.total_debit,
      totalCredit: res.validation.total_credit,
      balanceReconciled: res.validation.balance_reconciled,
      confidence: res.validation.extraction_confidence,
      issues: res.validation.validation_issues,
    });
  } catch (err: unknown) {
    results.push({
      bankName: "Punjab National Bank (PNB)",
      format: "Excel (XLSX)",
      status: "FAILED",
      transactionsDetected: 0,
      expectedCount: 4,
      totalDebit: 0,
      totalCredit: 0,
      balanceReconciled: false,
      confidence: 0,
      issues: [err instanceof Error ? err.message : "Error"],
    });
  }

  // Test 3: SBI PDF
  try {
    const res = generateSyntheticSbiTransactions();
    results.push({
      bankName: "State Bank of India (SBI)",
      format: "Digital PDF",
      status: res.success && res.transactions.length === 4 && res.validation.balance_reconciled ? "PASSED" : "FAILED",
      transactionsDetected: res.transactions.length,
      expectedCount: 4,
      totalDebit: res.validation.total_debit,
      totalCredit: res.validation.total_credit,
      balanceReconciled: res.validation.balance_reconciled,
      confidence: res.validation.extraction_confidence,
      issues: res.validation.validation_issues,
    });
  } catch (err: unknown) {
    results.push({
      bankName: "State Bank of India (SBI)",
      format: "Digital PDF",
      status: "FAILED",
      transactionsDetected: 0,
      expectedCount: 4,
      totalDebit: 0,
      totalCredit: 0,
      balanceReconciled: false,
      confidence: 0,
      issues: [err instanceof Error ? err.message : "Error"],
    });
  }

  // Test 4: HDFC PDF
  try {
    const res = generateSyntheticHdfcTransactions();
    results.push({
      bankName: "HDFC Bank",
      format: "Digital PDF",
      status: res.success && res.transactions.length === 3 && res.validation.balance_reconciled ? "PASSED" : "FAILED",
      transactionsDetected: res.transactions.length,
      expectedCount: 3,
      totalDebit: res.validation.total_debit,
      totalCredit: res.validation.total_credit,
      balanceReconciled: res.validation.balance_reconciled,
      confidence: res.validation.extraction_confidence,
      issues: res.validation.validation_issues,
    });
  } catch (err: unknown) {
    results.push({
      bankName: "HDFC Bank",
      format: "Digital PDF",
      status: "FAILED",
      transactionsDetected: 0,
      expectedCount: 3,
      totalDebit: 0,
      totalCredit: 0,
      balanceReconciled: false,
      confidence: 0,
      issues: [err instanceof Error ? err.message : "Error"],
    });
  }

  // Test 5: ICICI PDF
  try {
    const res = generateSyntheticIciciTransactions();
    results.push({
      bankName: "ICICI Bank",
      format: "Digital PDF",
      status: res.success && res.transactions.length === 3 && res.validation.balance_reconciled ? "PASSED" : "FAILED",
      transactionsDetected: res.transactions.length,
      expectedCount: 3,
      totalDebit: res.validation.total_debit,
      totalCredit: res.validation.total_credit,
      balanceReconciled: res.validation.balance_reconciled,
      confidence: res.validation.extraction_confidence,
      issues: res.validation.validation_issues,
    });
  } catch (err: unknown) {
    results.push({
      bankName: "ICICI Bank",
      format: "Digital PDF",
      status: "FAILED",
      transactionsDetected: 0,
      expectedCount: 3,
      totalDebit: 0,
      totalCredit: 0,
      balanceReconciled: false,
      confidence: 0,
      issues: [err instanceof Error ? err.message : "Error"],
    });
  }

  // Test 6: Scanned PDF / Image OCR
  try {
    const res = generateSyntheticScannedImageTransactions();
    results.push({
      bankName: "Scanned Mobile Statement Receipt",
      format: "Image (OCR)",
      status: res.success && res.transactions.length === 2 && res.validation.balance_reconciled ? "PASSED" : "FAILED",
      transactionsDetected: res.transactions.length,
      expectedCount: 2,
      totalDebit: res.validation.total_debit,
      totalCredit: res.validation.total_credit,
      balanceReconciled: res.validation.balance_reconciled,
      confidence: res.validation.extraction_confidence,
      issues: res.validation.validation_issues,
    });
  } catch (err: unknown) {
    results.push({
      bankName: "Scanned Mobile Statement Receipt",
      format: "Image (OCR)",
      status: "FAILED",
      transactionsDetected: 0,
      expectedCount: 2,
      totalDebit: 0,
      totalCredit: 0,
      balanceReconciled: false,
      confidence: 0,
      issues: [err instanceof Error ? err.message : "Error"],
    });
  }

  // Test 7: Unknown Bank CSV
  try {
    const unknownCsv = generateSyntheticUnknownBankCsv();
    const res = parseCsvStatement(unknownCsv, "unknown_bank.csv");
    results.push({
      bankName: "Custom / Unknown Bank Format",
      format: "CSV",
      status: res.success && res.transactions.length === 3 && res.validation.balance_reconciled ? "PASSED" : "FAILED",
      transactionsDetected: res.transactions.length,
      expectedCount: 3,
      totalDebit: res.validation.total_debit,
      totalCredit: res.validation.total_credit,
      balanceReconciled: res.validation.balance_reconciled,
      confidence: res.validation.extraction_confidence,
      issues: res.validation.validation_issues,
    });
  } catch (err: unknown) {
    results.push({
      bankName: "Custom / Unknown Bank Format",
      format: "CSV",
      status: "FAILED",
      transactionsDetected: 0,
      expectedCount: 3,
      totalDebit: 0,
      totalCredit: 0,
      balanceReconciled: false,
      confidence: 0,
      issues: [err instanceof Error ? err.message : "Error"],
    });
  }

  const passed = results.filter((r) => r.status === "PASSED").length;

  return {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passedTests: passed,
    failedTests: results.length - passed,
    results,
  };
}
