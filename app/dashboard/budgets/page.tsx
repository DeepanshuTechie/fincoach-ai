import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BudgetsClient from "./budgets-client";

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
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Manage</p>
            <h1 className="text-2xl font-bold text-slate-900">
              Monthly Budgets
            </h1>
          </div>
                    <a href="/dashboard" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Back to Dashboard</a>
        </div>

        <BudgetsClient
          categories={categories || []}
          budgets={budgets || []}
          transactions={transactions || []}
          userId={user.id}
        />
      </div>
    </main>
  );
}