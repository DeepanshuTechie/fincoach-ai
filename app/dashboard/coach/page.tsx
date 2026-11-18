import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { CoachClient } from "./coach-client";
import { generatePersonaCoachPlan } from "@/lib/coach-engine";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default async function CoachPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch real transaction history for the user
  const { data: rawTransactions } = await supabase
    .from("transactions")
    .select("id, description, amount, transaction_date, category_id, categories(name, color)")
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false })
    .limit(150);

  const transactions = (rawTransactions || []).map((t) => ({
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    transaction_date: t.transaction_date,
    category_id: t.category_id,
    categories: Array.isArray(t.categories) ? t.categories[0] : t.categories,
  }));

  // Initial coach plan with Shark persona
  const initialPlan = await generatePersonaCoachPlan(transactions, "shark");

  return (
    <div className="min-h-screen bg-[#f8f9fd] text-[#333333] transition-colors duration-200 dark:bg-[#080e0a] dark:text-[#f5f7fa] flex flex-col">
      <DashboardNav userEmail={user.email} />

      <main className="mx-auto flex-1 flex w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Breadcrumbs & Title */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#175624] hover:text-[#12441d] dark:text-[#dfb962] dark:hover:text-[#f0cf7e] transition mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#175624] dark:text-white">
                  Autonomous AI Financial Coach
                </h1>
                <span className="rounded-full bg-[#175624] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white dark:bg-[#dfb962] dark:text-[#080e0a]">
                  Proactive Hub
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                Decision intelligence, 6-month What-If simulation, and multi-persona tactical guidance
              </p>
            </div>
          </div>
        </div>

        {/* Client Interactive Workspace */}
        <CoachClient transactions={transactions} initialPlan={initialPlan} />
      </main>
    </div>
  );
}
