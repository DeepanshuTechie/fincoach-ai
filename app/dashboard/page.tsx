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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Welcome back</p>
            <h1 className="text-2xl font-bold text-slate-900">{user.email}</h1>
          </div>
          <a href="/dashboard/upload" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Upload Statement</a>
        </div>

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