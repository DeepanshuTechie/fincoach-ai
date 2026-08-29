import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";

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

    if (!description) {
      return;
    }

    const amount = Number(transaction.amount ?? 0);

    if (!Number.isFinite(amount)) {
      return;
    }

    const category = Array.isArray(transaction.categories)
      ? transaction.categories[0]
      : transaction.categories;

    // Ignore income transactions
    if (category?.name?.toLowerCase() === "income") {
      return;
    }

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
    if (!date) {
      return "Unknown";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Detected</p>

            <h1 className="text-2xl font-bold text-slate-900">
              Recurring Payments
            </h1>
          </div>

          <a
            href="/dashboard"
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Back to Dashboard
          </a>
        </div>

        {/* Monthly Total */}
        {recurring.length > 0 && (
          <Card className="mb-6 border-emerald-100 bg-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Estimated recurring spend
            </p>

            <p className="mt-1 text-2xl font-bold text-emerald-900">
              ~₹{Math.round(monthlyTotal).toLocaleString("en-IN")} / month
            </p>
          </Card>
        )}

        {/* Empty State */}
        {recurring.length === 0 ? (
          <Card className="p-6 text-sm text-slate-400">
            No recurring payments detected yet. This shows up once a merchant
            appears 2 or more times in your transactions.
          </Card>
        ) : (
          /* Recurring Payments */
          <div className="space-y-3">
            {recurring.map((payment) => (
              <Card
                key={payment.description}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: payment.color,
                    }}
                  />

                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">
                      {payment.description}
                    </p>

                    <p className="text-xs text-slate-400">
                      Seen {payment.count} times · last on{" "}
                      {formatDate(payment.lastDate)}
                    </p>
                  </div>
                </div>

                <p className="shrink-0 font-semibold text-slate-900">
                  ₹
                  {Math.round(
                    payment.total / payment.count
                  ).toLocaleString("en-IN")}
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    /avg
                  </span>
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}