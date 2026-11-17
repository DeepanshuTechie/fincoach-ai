import { UniversalTransaction, ValidationSummary, StatementMetadata } from "./types";

/**
 * StatementValidator: Verification Layer
 * Performs mathematical integrity checks, balance reconciliation, duplicate detection,
 * and extraction confidence scoring.
 */
export function validateStatement(
  transactions: UniversalTransaction[],
  metadata?: Partial<StatementMetadata>
): { validation: ValidationSummary; validatedTransactions: UniversalTransaction[] } {
  if (!transactions || transactions.length === 0) {
    return {
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
        validation_issues: ["No transactions detected in statement document."],
      },
      validatedTransactions: [],
    };
  }

  const issues: string[] = [];
  let totalDebit = 0;
  let totalCredit = 0;
  let verifiedCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;

  // Track seen transactions for duplicate detection (date + description + debit + credit + balance)
  const seenTxns = new Map<string, number>();

  const validatedTransactions: UniversalTransaction[] = transactions.map((t, idx) => {
    const copy = { ...t };
    const rowIssues: string[] = copy.issues ? [...copy.issues] : [];

    totalDebit += copy.debit;
    totalCredit += copy.credit;

    // 1. Duplicate check
    const sig = `${copy.date}|${copy.description.toLowerCase().trim()}|${copy.debit}|${copy.credit}|${copy.balance ?? ""}`;
    if (seenTxns.has(sig)) {
      copy.status = "warning";
      copy.confidence = Math.min(copy.confidence, 0.7);
      rowIssues.push(`Potential duplicate of transaction at row #${seenTxns.get(sig)! + 1}`);
      duplicateCount++;
    } else {
      seenTxns.set(sig, idx);
    }

    // 2. Amount sanity
    if (copy.debit === 0 && copy.credit === 0) {
      copy.status = "error";
      rowIssues.push("Both debit and credit amounts are zero or empty.");
      errorCount++;
    } else if (copy.status === "error") {
      errorCount++;
    } else if (copy.status === "warning") {
      warningCount++;
    } else {
      verifiedCount++;
    }

    copy.issues = rowIssues.length > 0 ? rowIssues : undefined;
    return copy;
  });

  totalDebit = Math.round(totalDebit * 100) / 100;
  totalCredit = Math.round(totalCredit * 100) / 100;
  const netCashflow = Math.round((totalCredit - totalDebit) * 100) / 100;

  // 3. Balance Reconciliation Check: Previous Balance + Credit - Debit = Current Balance
  let balanceReconciled = false;
  let reconciliationDifference: number | null = null;
  let openingBal: number | null = metadata?.opening_balance ?? null;
  let closingBal: number | null = metadata?.closing_balance ?? null;

  // If opening/closing balance not explicitly extracted, derive from first and last transaction with balance
  const txnsWithBalance = validatedTransactions.filter((t) => t.balance !== null);
  if (txnsWithBalance.length >= 2) {
    const firstBal = txnsWithBalance[0].balance!;
    const lastBal = txnsWithBalance[txnsWithBalance.length - 1].balance!;

    // Check chronological order (ascending vs descending)
    const isAscending = validatedTransactions[0].date <= validatedTransactions[validatedTransactions.length - 1].date;

    if (openingBal === null) {
      openingBal = isAscending
        ? Math.round((firstBal - txnsWithBalance[0].credit + txnsWithBalance[0].debit) * 100) / 100
        : lastBal;
    }
    if (closingBal === null) {
      closingBal = isAscending ? lastBal : firstBal;
    }

    // Test math consistency row by row
    let mathChecksPassed = 0;
    let mathChecksTotal = 0;

    for (let i = 1; i < txnsWithBalance.length; i++) {
      const prev = txnsWithBalance[i - 1];
      const curr = txnsWithBalance[i];
      mathChecksTotal++;

      if (isAscending) {
        const expected = Math.round((prev.balance! + curr.credit - curr.debit) * 100) / 100;
        if (Math.abs(expected - curr.balance!) < 0.1) {
          mathChecksPassed++;
        }
      } else {
        // Reverse chronological (newest first): Current's balance = Next's balance - Next's credit + Next's debit
        const expected = Math.round((curr.balance! + prev.credit - prev.debit) * 100) / 100;
        if (Math.abs(expected - prev.balance!) < 0.1) {
          mathChecksPassed++;
        }
      }
    }

    if (mathChecksTotal > 0 && mathChecksPassed / mathChecksTotal >= 0.8) {
      balanceReconciled = true;
    }
  }

  // Calculate projected closing balance
  let calculatedClosingBalance: number | null = null;
  if (openingBal !== null) {
    calculatedClosingBalance = Math.round((openingBal + totalCredit - totalDebit) * 100) / 100;
    if (closingBal !== null) {
      reconciliationDifference = Math.round(Math.abs(calculatedClosingBalance - closingBal) * 100) / 100;
      if (reconciliationDifference < 0.5) {
        balanceReconciled = true;
      } else {
        issues.push(
          `Balance discrepancy detected: Calculated closing balance ₹${calculatedClosingBalance.toLocaleString("en-IN")} differs from stated closing balance ₹${closingBal.toLocaleString("en-IN")} by ₹${reconciliationDifference}.`
        );
      }
    }
  }

  if (duplicateCount > 0) {
    issues.push(`${duplicateCount} potential duplicate transaction(s) identified.`);
  }

  if (errorCount > 0) {
    issues.push(`${errorCount} transaction(s) have unreadable or missing values.`);
  }

  // Overall statement extraction confidence (0.0 to 1.0)
  const avgRowConfidence =
    validatedTransactions.reduce((sum, t) => sum + t.confidence, 0) / validatedTransactions.length;
  let overallConfidence = avgRowConfidence;
  if (balanceReconciled) overallConfidence = Math.min(1.0, overallConfidence + 0.1);
  if (errorCount > 0) overallConfidence = Math.max(0.2, overallConfidence - (errorCount / transactions.length) * 0.3);

  return {
    validation: {
      total_transactions: transactions.length,
      verified_count: verifiedCount,
      warning_count: warningCount,
      error_count: errorCount,
      total_debit: totalDebit,
      total_credit: totalCredit,
      net_cashflow: netCashflow,
      opening_balance: openingBal,
      closing_balance: closingBal,
      calculated_closing_balance: calculatedClosingBalance,
      balance_reconciled: balanceReconciled,
      reconciliation_difference: reconciliationDifference,
      duplicate_count: duplicateCount,
      extraction_confidence: Math.round(overallConfidence * 100) / 100,
      validation_issues: issues,
    },
    validatedTransactions,
  };
}
