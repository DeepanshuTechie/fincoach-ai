import { UniversalTransaction } from "./types";
import { SupabaseClient } from "@supabase/supabase-js";
import { categorizeTransactions } from "@/lib/categorize";

export interface FinCoachTransactionInsert {
  user_id: string;
  description: string;
  amount: number;
  transaction_date: string;
  category_id: string | null;
}

export interface CommitToFinCoachResult {
  success: boolean;
  insertedCount: number;
  categorizedCount: number;
  error?: string;
}

/**
 * FinCoachDataAdapter
 * Seamlessly adapts Universal Transactions into the existing FinCoach AI schema and database ledger.
 * - Outflows (debit > 0): Routed through merchant memory & Gemini AI classification.
 * - Inflows (credit > 0): Automatically assigned to the "Income" category.
 */
export async function commitUniversalTransactionsToFinCoach(
  supabase: SupabaseClient,
  userId: string,
  transactions: UniversalTransaction[]
): Promise<CommitToFinCoachResult> {
  if (!transactions || transactions.length === 0) {
    return { success: false, insertedCount: 0, categorizedCount: 0, error: "No transactions to commit." };
  }

  try {
    // 1. Fetch available categories
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("id, name");

    if (catError || !categories) {
      throw new Error(`Failed to fetch categories: ${catError?.message || "Unknown error"}`);
    }

    const nameToId = new Map<string, string>();
    categories.forEach((c) => nameToId.set(c.name.toLowerCase().trim(), c.id));
    const incomeCategoryId = nameToId.get("income") || null;

    // 2. Fetch existing user merchant memory
    const { data: memoryRows } = await supabase
      .from("merchant_memory")
      .select("description, category_id")
      .eq("user_id", userId);

    const memoryMap = new Map<string, string>();
    (memoryRows || []).forEach((m) => {
      if (m.description && m.category_id) {
        memoryMap.set(m.description.toLowerCase().trim(), m.category_id);
      }
    });

    // 3. Separate recognized merchants and Income from unknown transactions
    const assignedCategoryIds: (string | null)[] = new Array(transactions.length).fill(null);
    const unknownTransactions: { index: number; description: string; amount: number }[] = [];

    transactions.forEach((t, i) => {
      // If it's credit/deposit, assign to Income directly
      if (t.credit > 0 && t.debit === 0) {
        assignedCategoryIds[i] = incomeCategoryId;
        return;
      }

      // Check merchant memory
      const normDesc = t.description.toLowerCase().trim();
      const remembered = memoryMap.get(normDesc);
      if (remembered) {
        assignedCategoryIds[i] = remembered;
      } else {
        unknownTransactions.push({
          index: i,
          description: t.description,
          amount: t.debit > 0 ? t.debit : t.credit,
        });
      }
    });

    // 4. Run AI categorization for new/unknown merchants using existing FinCoach AI engine
    const newMemoryEntries: { user_id: string; description: string; category_id: string }[] = [];
    if (unknownTransactions.length > 0) {
      const aiResults = await categorizeTransactions(
        unknownTransactions.map((u) => ({ description: u.description, amount: u.amount }))
      );

      unknownTransactions.forEach((u, i) => {
        const catName = (aiResults[i] || "Other").toLowerCase().trim();
        const catId = nameToId.get(catName) || nameToId.get("other") || null;
        assignedCategoryIds[u.index] = catId;

        if (catId) {
          newMemoryEntries.push({
            user_id: userId,
            description: u.description,
            category_id: catId,
          });
        }
      });
    }

    // 5. Update merchant memory for future auto-classification
    if (newMemoryEntries.length > 0) {
      await supabase.from("merchant_memory").upsert(newMemoryEntries, {
        onConflict: "user_id,description",
      });
    }

    // 6. Format inserts for FinCoach ledger
    const rowsToInsert: FinCoachTransactionInsert[] = transactions.map((t, i) => {
      const isIncome = t.credit > 0 && t.debit === 0;
      const finalAmount = isIncome ? t.credit : t.debit;

      return {
        user_id: userId,
        description: t.description,
        amount: Math.round(finalAmount * 100) / 100,
        transaction_date: t.date,
        category_id: assignedCategoryIds[i],
      };
    });

    // Insert in batches of 100 to avoid payload limits
    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < rowsToInsert.length; i += batchSize) {
      const batch = rowsToInsert.slice(i, i + batchSize);
      const { error: insertError } = await supabase.from("transactions").insert(batch);
      if (insertError) {
        throw new Error(`Database insert failed: ${insertError.message}`);
      }
      totalInserted += batch.length;
    }

    return {
      success: true,
      insertedCount: totalInserted,
      categorizedCount: unknownTransactions.length,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to commit transactions to FinCoach";
    return {
      success: false,
      insertedCount: 0,
      categorizedCount: 0,
      error: msg,
    };
  }
}

/**
 * Converts Universal Transactions into standard RFC 4180 CSV string
 */
export function convertUniversalToCsv(transactions: UniversalTransaction[]): string {
  const headers = ["date", "description", "debit", "credit", "balance", "currency", "reference_number", "payment_method", "status"];
  const lines = [headers.join(",")];

  for (const t of transactions) {
    const desc = `"${t.description.replace(/"/g, '""')}"`;
    const ref = t.reference_number ? `"${t.reference_number.replace(/"/g, '""')}"` : "";
    const bal = t.balance !== null ? t.balance.toFixed(2) : "";

    lines.push([
      t.date,
      desc,
      t.debit.toFixed(2),
      t.credit.toFixed(2),
      bal,
      t.currency,
      ref,
      t.payment_method || "",
      t.status,
    ].join(","));
  }

  return lines.join("\n");
}

/**
 * Triggers client-side browser download of the Universal CSV
 */
export function triggerUniversalCsvDownload(csvContent: string, fileName: string = "fincoach-standardized.csv") {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName.endsWith(".csv") ? fileName : `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
