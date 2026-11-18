import { GoogleGenerativeAI } from "@google/generative-ai";
import { normalizeTransaction } from "./normalizer";
import { validateStatement } from "./statement-validator";
import { UniversalStatementParseResult, StatementMetadata, UniversalTransaction } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

interface GeminiStatementResponse {
  bank_name?: string;
  account_number_masked?: string;
  statement_period?: {
    start_date?: string;
    end_date?: string;
  };
  opening_balance?: number;
  closing_balance?: number;
  transactions?: Array<{
    date: string;
    value_date?: string;
    description: string;
    debit?: number;
    credit?: number;
    amount?: number;
    type?: string;
    balance?: number;
    reference_number?: string;
    source_page?: number;
  }>;
}

/**
 * Extracts and standardizes bank transactions from Digital PDFs, Scanned PDFs, and Images (JPG/PNG)
 * using high-precision Document Intelligence.
 */
export async function extractStatementFromDocument(
  buffer: Buffer | Uint8Array,
  mimeType: string,
  fileName: string = "statement.pdf"
): Promise<UniversalStatementParseResult> {
  const isImage = mimeType.startsWith("image/");
  const fileType = isImage ? "image" : "pdf";
  const base64Data = Buffer.from(buffer).toString("base64");

  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1, // Deterministic extraction accuracy
    },
  });

  const prompt = `You are a Senior Financial Document Intelligence Engineer.
Analyze this bank statement document (${isImage ? "scanned image/receipt" : "PDF statement"}).
Extract the full transaction ledger with 100% fidelity. Do NOT skip any transaction.

Return ONLY a valid JSON object matching this exact schema:
{
  "bank_name": "Name of the Bank (e.g. State Bank of India, HDFC Bank, ICICI Bank, Axis Bank, Punjab National Bank, etc.)",
  "account_number_masked": "Masked account number if present, e.g. XXXX1234",
  "statement_period": {
    "start_date": "YYYY-MM-DD or null",
    "end_date": "YYYY-MM-DD or null"
  },
  "opening_balance": number or null,
  "closing_balance": number or null,
  "transactions": [
    {
      "date": "YYYY-MM-DD (convert transaction date to standard ISO format)",
      "value_date": "YYYY-MM-DD or null",
      "description": "Full original narration/particulars/merchant/reference line",
      "debit": number (withdrawal/expense amount as positive number, or 0 if credit),
      "credit": number (deposit/salary amount as positive number, or 0 if debit),
      "balance": number or null (running closing balance after this transaction),
      "reference_number": "cheque/UTR/ref ID if present or null",
      "source_page": 1
    }
  ]
}

Important Rules:
1. Preserve original narration accurately.
2. Ensure debit and credit are separated into distinct numeric fields.
3. If a transaction is an outflow/debit, debit > 0 and credit = 0.
4. If a transaction is an inflow/credit/deposit/salary, credit > 0 and debit = 0.
5. If running balance is visible in the row, include it in the "balance" property.
6. Do NOT fabricate or invent categories. Only extract facts.
7. Return ONLY the JSON object.`;

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType === "application/pdf" ? "application/pdf" : mimeType,
          data: base64Data,
        },
      },
      prompt,
    ]);

    const text = result.response.text();
    const data: GeminiStatementResponse = JSON.parse(text);

    const rawTxns = Array.isArray(data.transactions) ? data.transactions : [];

    const transactions: UniversalTransaction[] = rawTxns.map((t, idx) => {
      return normalizeTransaction({
        rawDate: t.date,
        rawValueDate: t.value_date,
        rawDescription: t.description,
        rawDebit: t.debit,
        rawCredit: t.credit,
        rawAmount: t.amount,
        rawType: t.type,
        rawBalance: t.balance,
        rawReference: t.reference_number,
        sourceRow: idx + 1,
        sourcePage: t.source_page || 1,
      });
    });

    const metadata: StatementMetadata = {
      bank_name: data.bank_name || "Detected Universal Statement",
      account_number_masked: data.account_number_masked || undefined,
      statement_period: {
        start_date: data.statement_period?.start_date || (transactions.length > 0 ? transactions[0].date : null),
        end_date:
          data.statement_period?.end_date ||
          (transactions.length > 0 ? transactions[transactions.length - 1].date : null),
      },
      opening_balance: typeof data.opening_balance === "number" ? data.opening_balance : null,
      closing_balance: typeof data.closing_balance === "number" ? data.closing_balance : null,
      transaction_count: transactions.length,
      currency: "INR",
      detected_file_type: fileType,
      file_name: fileName,
      file_size_bytes: buffer.byteLength,
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
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to extract transactions from document";
    return {
      success: false,
      metadata: {
        file_name: fileName,
        file_size_bytes: buffer.byteLength,
        detected_file_type: fileType,
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
