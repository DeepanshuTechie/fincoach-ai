import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardCharts from "./dashboard-charts";

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
    .select("id, description, amount, transaction_date, categories(name, color)")
    .order("transaction_date", { ascending: false });

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
        <DashboardCharts transactions={transactions || []} />
      </div>
    </main>
  );
}