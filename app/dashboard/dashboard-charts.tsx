"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

type Category = { id: string; name: string; color: string };

type Transaction = {
  id: string;
  description: string;
  amount: number;
  transaction_date: string;
  transaction_time: string | null;
  category_id: string | null;
  categories: { name: string; color: string } | null;
};

export default function DashboardCharts({
  transactions,
  categories,
  userId,
}: {
  transactions: Transaction[];
  categories: Category[];
  userId: string;
}) {
  const [txns, setTxns] = useState(transactions);
  const [hints, setHints] = useState<Record<string, string>>({});
  const [thinking, setThinking] = useState<Record<string, boolean>>({});
  const supabase = createClient();

  async function updateCategory(
    txnId: string,
    description: string,
    newCategoryId: string
  ) {
    const newCategory = categories.find((c) => c.id === newCategoryId);

    setTxns((prev) =>
      prev.map((t) =>
        t.id === txnId
          ? {
              ...t,
              category_id: newCategoryId,
              categories: newCategory
                ? { name: newCategory.name, color: newCategory.color }
                : null,
            }
          : t
      )
    );

    await supabase
      .from("transactions")
      .update({ category_id: newCategoryId })
      .eq("id", txnId);

    await supabase.from("merchant_memory").upsert(
      [{ user_id: userId, description, category_id: newCategoryId }],
      { onConflict: "user_id,description" }
    );
  }

  async function handleDescribeSubmit(
    txnId: string,
    description: string,
    amount: number
  ) {
    const hint = hints[txnId];
    if (!hint || hint.trim() === "") return;

    setThinking((prev) => ({ ...prev, [txnId]: true }));

    const res = await fetch("/api/recategorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, amount, hint }),
    });

    const data = await res.json();
    setThinking((prev) => ({ ...prev, [txnId]: false }));

    if (data.category) {
      const matchedCategory = categories.find((c) => c.name === data.category);
      if (matchedCategory) {
        await updateCategory(txnId, description, matchedCategory.id);
      }
    }
  }

  const totalSpent = txns
    .filter((t) => t.categories?.name !== "Income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalIncome = txns
    .filter((t) => t.categories?.name === "Income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const categoryTotals = new Map<string, { value: number; color: string }>();
  txns
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              Recent Transactions
            </h2>
            <p className="text-xs text-slate-400">
              ✨ Auto-categorized by AI
            </p>
          </div>
          <div className="space-y-4">
            {txns.slice(0, 8).map((t) => {
              const color = t.categories?.color || "#64748b";
              const isUnclear = !t.categories || t.categories.name === "Other";

              return (
                <div key={t.id} className="border-b border-slate-100 pb-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-700">
                        {t.description}
                      </p>
                      <p className="text-xs text-slate-400">
                        {t.transaction_date}
                      </p>
                    </div>

                    <select
                      value={t.category_id || ""}
                      onChange={(e) =>
                        updateCategory(t.id, t.description, e.target.value)
                      }
                      style={{
                        backgroundColor: `${color}1a`,
                        color: color,
                        borderColor: `${color}55`,
                      }}
                      className="cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold"
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <p
                      className={
                        t.categories?.name === "Income"
                          ? "w-20 shrink-0 text-right font-semibold text-emerald-600"
                          : "w-20 shrink-0 text-right font-semibold text-slate-900"
                      }
                    >
                      ₹{Number(t.amount).toLocaleString()}
                    </p>
                  </div>

                  {isUnclear && (
  <div className="mt-2 space-y-1.5">
    {t.transaction_time && (
      <p className="text-xs text-slate-400">
        🕐 This happened at {t.transaction_time} on {t.transaction_date} — does that help you remember?
      </p>
    )}
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="What was this for? e.g. dinner with friends"
        value={hints[t.id] || ""}
        onChange={(e) =>
          setHints((prev) => ({
            ...prev,
            [t.id]: e.target.value,
          }))
        }
        className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs"
      />
      <button
        onClick={() =>
          handleDescribeSubmit(t.id, t.description, t.amount)
        }
        disabled={thinking[t.id]}
        className="rounded bg-slate-800 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {thinking[t.id] ? "Thinking..." : "Ask AI"}
      </button>
    </div>
  </div>
)}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}