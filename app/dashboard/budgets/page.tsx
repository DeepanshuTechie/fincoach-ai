import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BudgetsClient from "./budgets-client";
import { DashboardNav } from "@/components/dashboard-nav";
import Link from "next/link";
import { ArrowLeft, WalletCards } from "lucide-react";

export default async function BudgetsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, color")
    .neq("name", "Income")
    .order("name");

  const { data: budgets } = await supabase
    .from("budgets")
    .select("id, category_id, monthly_limit")
    .eq("user_id", user.id);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount, category_id")
    .eq("user_id", user.id)
    .gte("transaction_date", monthStart)
    .lte("transaction_date", monthEnd);

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

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5E6F9] text-[#175624] dark:bg-[#dfb962]/15 dark:text-[#dfb962] shadow-2xs">
                <WalletCards className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#175624] dark:text-white">
                  Monthly Budgets
                </h1>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Target expenditure limits and automated budget variance warnings
                </p>
              </div>
            </div>
          </div>
        </div>

        <BudgetsClient
          categories={categories || []}
          budgets={budgets || []}
          transactions={transactions || []}
          userId={user.id}
        />
      </main>
    </div>
  );
}
