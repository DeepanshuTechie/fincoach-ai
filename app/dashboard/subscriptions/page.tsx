import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { DashboardNav } from "@/components/dashboard-nav";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Layers } from "lucide-react";

type Category = {
  name: string;
  color: string;
};

type Transaction = {
  description: string | null;
  amount: number | string | null;
  transaction_date: string | null;
  categories: Category | Category[] | null;
};

type RecurringPayment = {
  description: string;
  count: number;
  total: number;
  color: string;
  lastDate: string;
};

export default async function SubscriptionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select(
      `
        description,
        amount,
        transaction_date,
        categories (
          name,
          color
        )
      `
    )
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching transactions:", error);
  }

  const grouped = new Map<
    string,
    {
      count: number;
      total: number;
      color: string;
      lastDate: string;
    }
  >();

  ((transactions || []) as Transaction[]).forEach((transaction) => {
    const description = transaction.description?.trim();
    if (!description) return;

    const amount = Number(transaction.amount ?? 0);
    if (!Number.isFinite(amount)) return;

    const category = Array.isArray(transaction.categories)
      ? transaction.categories[0]
      : transaction.categories;

    // Ignore income transactions
    if (category?.name?.toLowerCase() === "income") return;

    const color = category?.color || "#64748b";
    const transactionDate = transaction.transaction_date || "";

    const existing = grouped.get(description);

    if (existing) {
      grouped.set(description, {
        count: existing.count + 1,
        total: existing.total + amount,
        color: existing.color,
        lastDate:
          transactionDate > existing.lastDate
            ? transactionDate
            : existing.lastDate,
      });
    } else {
      grouped.set(description, {
        count: 1,
        total: amount,
        color,
        lastDate: transactionDate,
      });
    }
  });

  const recurring: RecurringPayment[] = Array.from(grouped.entries())
    .filter(([, value]) => value.count >= 2)
    .map(([description, value]) => ({
      description,
      ...value,
    }))
    .sort((a, b) => b.total - a.total);

  const monthlyTotal = recurring.reduce((sum, payment) => {
    return sum + payment.total / payment.count;
  }, 0);

  const formatDate = (date: string) => {
    if (!date) return "Unknown";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return date;

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fd] text-[#333333] transition-colors duration-200 dark:bg-[#080e0a] dark:text-[#f5f7fa]">
      <DashboardNav userEmail={user.email} />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#175624] hover:text-[#12441d] dark:text-[#dfb962] dark:hover:text-[#f0cf7e] transition mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5E6F9] text-[#175624] dark:bg-[#dfb962]/15 dark:text-[#dfb962]">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#175624] dark:text-white">
                Recurring Subscriptions
              </h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Automated cadence analysis across verified statement records
              </p>
            </div>
          </div>
        </div>

        {/* Estimated Monthly Run Rate Card */}
        {recurring.length > 0 && (
          <div className="mb-6 rounded-2xl border border-[#E5E6F9] bg-white p-5 shadow-xs dark:border-white/[0.08] dark:bg-[#11141d]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Projected Monthly Run Rate
                </p>
                <p className="mt-1 text-2xl font-extrabold text-[#333333] dark:text-white font-tabular">
                  ~₹{Math.round(monthlyTotal).toLocaleString("en-IN")}{" "}
                  <span className="text-xs font-normal text-slate-400">/ month</span>
                </p>
              </div>
              <div className="rounded-full bg-[#E5E6F9] px-3 py-1 text-xs font-semibold text-[#175624] dark:bg-[#dfb962]/15 dark:text-[#dfb962]">
                {recurring.length} Recurring Charges
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {recurring.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-500 border-[#E5E6F9] bg-white dark:border-white/[0.08] dark:bg-[#11141d]">
            <RefreshCw className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-[#333333] dark:text-slate-300">
              No recurring payments identified yet
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Merchants appearing 2 or more times across your statement history will be cataloged here automatically.
            </p>
          </Card>
        ) : (
          /* Recurring Subscriptions List */
          <div className="space-y-3">
            {recurring.map((payment) => (
              <Card
                key={payment.description}
                className="flex items-center justify-between gap-4 p-4 border-[#E5E6F9] bg-white shadow-xs hover:border-[#A4873E]/40 dark:border-white/[0.08] dark:bg-[#11141d] dark:hover:border-[#dfb962]/30 transition"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: payment.color }}
                  />

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#333333] dark:text-white text-sm">
                      {payment.description}
                    </p>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="inline-block rounded-md bg-[#E5E6F9]/60 px-2 py-0.5 text-[10px] font-medium text-[#175624] dark:bg-white/[0.06] dark:text-slate-300">
                        {payment.count} occurrences
                      </span>
                      <span className="text-xs text-slate-400">
                        Last billed on {formatDate(payment.lastDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-bold text-[#175624] dark:text-[#dfb962] text-base font-tabular">
                    ₹{Math.round(payment.total / payment.count).toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Average charge
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
