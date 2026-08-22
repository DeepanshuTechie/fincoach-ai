"use client";

import { Card } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  transaction_date: string;
  categories: { name: string; color: string } | null;
};

export default function DashboardCharts({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const totalSpent = transactions
    .filter((t) => t.categories?.name !== "Income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalIncome = transactions
    .filter((t) => t.categories?.name === "Income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const categoryTotals = new Map<string, { value: number; color: string }>();
  transactions
    .filter((t) => t.categories?.name !== "Income")
    .forEach((t) => {
      const name = t.categories?.name || "Other";
      const color = t.categories?.color || "#64748b";
      const existing = categoryTotals.get(name);
      categoryTotals.set(name, {
        value: (existing?.value || 0) + Number(t.amount),
        color,
      });
    });

  const pieData = Array.from(categoryTotals.entries()).map(
    ([name, { value, color }]) => ({ name, value, color })
  );

  const topCategory = pieData.sort((a, b) => b.value - a.value)[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Total Spent</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            ₹{totalSpent.toLocaleString()}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Total Income</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            ₹{totalIncome.toLocaleString()}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Top Category</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {topCategory?.name || "—"}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 font-semibold text-slate-900">
            Spending by Category
          </h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => entry.name}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400">
              No data yet — upload a statement to see your breakdown.
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 font-semibold text-slate-900">
            Recent Transactions
          </h2>
          <div className="space-y-3">
            {transactions.slice(0, 8).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <p className="font-medium text-slate-700">
                    {t.description}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t.categories?.name || "Uncategorized"} ·{" "}
                    {t.transaction_date}
                  </p>
                </div>
                <p
                  className={
                    t.categories?.name === "Income"
                      ? "font-semibold text-emerald-600"
                      : "font-semibold text-slate-900"
                  }
                >
                  ₹{Number(t.amount).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}