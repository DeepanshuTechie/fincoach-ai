import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardCharts from "./dashboard-charts";
import { generateMonthlyInsight } from "@/lib/insights";
import { DashboardNav } from "@/components/dashboard-nav";
import { AlertCircle, Calendar, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Parallelized database fetch (3x faster than sequential waterfalls)
  const [
    { data: rawTransactions },
    { data: categories },
    { data: budgets },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "id, description, amount, transaction_date, category_id, categories(name, color)"
      )
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .limit(200),
    supabase
      .from("categories")
      .select("id, name, color")
      .order("name"),
    supabase
      .from("budgets")
      .select("category_id, monthly_limit")
      .eq("user_id", user.id),
  ]);

  // Normalize transactions categories property so it is strictly single object or null
  const normalizedTransactions = (rawTransactions || []).map((t) => {
    const cat = Array.isArray(t.categories) ? t.categories[0] : t.categories;
    return {
      ...t,
      categories: cat as { name: string; color: string } | null,
    };
  });

  const insight = await generateMonthlyInsight(normalizedTransactions);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const thisMonthSpend = new Map<string, number>();
  normalizedTransactions
    .filter((t) => t.transaction_date >= monthStart)
    .forEach((t) => {
      if (!t.category_id) return;
      thisMonthSpend.set(
        t.category_id,
        (thisMonthSpend.get(t.category_id) || 0) + Number(t.amount)
      );
    });

  const overBudgetCategories = (budgets || [])
    .filter((b) => (thisMonthSpend.get(b.category_id) || 0) > b.monthly_limit)
    .map((b) => {
      const cat = (categories || []).find((c) => c.id === b.category_id);
      return {
        name: cat?.name || "Unknown",
        spent: thisMonthSpend.get(b.category_id) || 0,
        limit: b.monthly_limit,
      };
    });

  const formattedCurrentMonth = now.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#f8f9fd] text-[#333333] transition-colors duration-200 dark:bg-[#080e0a] dark:text-[#f5f7fa]">
      <DashboardNav userEmail={user.email} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Header / Greeting */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              <Calendar className="h-3.5 w-3.5 text-[#175624] dark:text-[#34d399]" />
              <span>{formattedCurrentMonth} Overview</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#175624] dark:text-white">
              Financial Portfolio
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E6F9] bg-white px-3 py-1 text-xs font-medium text-[#333333] shadow-2xs dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-[#dfb962]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#A4873E] dark:bg-[#dfb962] animate-pulse" />
              Realtime Sync
            </span>
          </div>
        </div>

        {/* AI Financial Coach Hub Hero Teaser */}
        <div className="mb-6 rounded-2xl border border-[#A4873E]/30 bg-gradient-to-r from-[#175624]/10 via-[#A4873E]/10 to-transparent p-4 sm:p-5 dark:border-[#dfb962]/20 dark:from-[#17241b] dark:via-white/[0.02]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#175624] text-white dark:bg-[#dfb962] dark:text-[#080e0a] shadow-xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#175624] dark:text-white">
                    Autonomous AI Financial Coach
                  </h3>
                  <span className="rounded-full bg-[#175624] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white dark:bg-[#dfb962] dark:text-[#080e0a]">
                    Proactive Hub
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Simulate high-ticket purchases with What-If EMI projection, calculate your FinScore (0–1000), and get tactical weekly drills.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/coach"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#175624] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#12441d] active:scale-[0.98] dark:bg-[#dfb962] dark:text-[#080e0a] dark:hover:bg-[#eac36e] shrink-0"
            >
              <span>Launch AI Coach Hub</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Budget Warning Banner (if any) */}
        {overBudgetCategories.length > 0 && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-900 shadow-2xs dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5 dark:text-rose-400" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold uppercase tracking-wider text-[11px] text-rose-700 dark:text-rose-400">
                    Budget Variance Alert
                  </span>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-500/20 dark:text-rose-300">
                    {overBudgetCategories.length} {overBudgetCategories.length === 1 ? "Category" : "Categories"} Exceeded
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                  {overBudgetCategories.map((c) => (
                    <div
                      key={c.name}
                      className="rounded-lg border border-rose-200 bg-white/80 px-3 py-1.5 text-xs font-medium dark:border-rose-500/20 dark:bg-white/[0.02]"
                    >
                      <span className="font-bold text-[#333333] dark:text-white">{c.name}:</span>{" "}
                      <span className="text-rose-700 dark:text-rose-300 font-tabular font-semibold">
                        ₹{c.spent.toLocaleString("en-IN")}
                      </span>{" "}
                      (₹{(c.spent - c.limit).toLocaleString("en-IN")} over ₹{c.limit.toLocaleString("en-IN")})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Executive Briefing (AI Insight) */}
        <div className="mb-8 rounded-2xl border border-[#E5E6F9] bg-white p-5 shadow-xs dark:border-white/[0.08] dark:bg-[#11141d]">
          <div className="flex items-start gap-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E5E6F9] text-[#175624] dark:bg-[#dfb962]/15 dark:text-[#dfb962]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#333333] dark:text-slate-300">
                  Monthly Financial Briefing
                </span>
                <span className="rounded-md bg-[#A4873E]/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-[#A4873E] dark:bg-white/[0.06] dark:text-[#dfb962]">
                  Gemini AI
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#333333]/90 leading-relaxed dark:text-slate-300">
                {insight}
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Charts & Transaction Workspace */}
        <DashboardCharts
          transactions={normalizedTransactions}
          categories={categories || []}
          userId={user.id}
        />
      </main>
    </div>
  );
}
