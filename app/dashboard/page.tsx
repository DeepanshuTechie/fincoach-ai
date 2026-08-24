import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardCharts from "./dashboard-charts";
import { generateMonthlyInsight } from "@/lib/insights";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, description, amount, transaction_date, category_id, categories(name, color)")
    .order("transaction_date", { ascending: false });

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, color")
    .order("name");

  const insight = await generateMonthlyInsight(transactions || []);

  const { data: budgets } = await supabase
    .from("budgets")
    .select("category_id, monthly_limit")
    .eq("user_id", user.id);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const thisMonthSpend = new Map<string, number>();
  (transactions || [])
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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Welcome back</p>
            <h1 className="text-2xl font-bold text-slate-900">{user.email}</h1>
          </div>
          <div className="flex gap-2">
            <a href="/dashboard/budgets" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Budgets</a>
            <a href="/dashboard/chat" className="rounded-md border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50">Chat with AI</a>
            <a href="/dashboard/upload" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Upload Statement</a>
          </div>
        </div>

               {overBudgetCategories.length > 0 && (
          <div className="relative mb-6 overflow-hidden rounded-lg border-2 border-red-300 bg-red-50 p-5 shadow-md">
            <div className="absolute -right-6 -top-6 h-24 w-24 animate-ping rounded-full bg-red-200 opacity-40" />
            <div className="relative flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
                <span className="text-base font-bold">
                  {overBudgetCategories.length}
                </span>
              </div>
              <div>
                <p className="mb-1 text-sm font-bold uppercase tracking-wide text-red-700">
                  🔔 Budget Alert — {overBudgetCategories.length}{" "}
                  {overBudgetCategories.length === 1 ? "category" : "categories"}{" "}
                  over limit
                </p>
                <div className="space-y-1">
                  {overBudgetCategories.map((c) => (
                    <p key={c.name} className="text-sm text-red-700">
                      <span className="font-semibold">{c.name}:</span> ₹
                      {c.spent.toLocaleString()} spent — ₹
                      {(c.spent - c.limit).toLocaleString()} over your ₹
                      {c.limit.toLocaleString()} limit
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 rounded-lg border border-emerald-100 bg-emerald-50 p-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            ✨ Your Money Story
          </p>
          <p className="text-sm leading-relaxed text-emerald-900">{insight}</p>
        </div>

        <DashboardCharts
          transactions={transactions || []}
          categories={categories || []}
          userId={user.id}
        />
      </div>
    </main>
  );
}