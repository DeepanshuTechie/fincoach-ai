"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Category = { id: string; name: string; color: string };
type Budget = { id: string; category_id: string; monthly_limit: number };
type Transaction = { amount: number; category_id: string | null };

export default function BudgetsClient({
  categories,
  budgets,
  transactions,
  userId,
}: {
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  userId: string;
}) {
  const [limits, setLimits] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    budgets.forEach((b) => {
      initial[b.category_id] = String(b.monthly_limit);
    });
    return initial;
  });
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [savedBudgets, setSavedBudgets] = useState(budgets);

  const supabase = createClient();

  const spendByCategory = new Map<string, number>();
  transactions.forEach((t) => {
    if (!t.category_id) return;
    spendByCategory.set(
      t.category_id,
      (spendByCategory.get(t.category_id) || 0) + Number(t.amount)
    );
  });

  async function saveBudget(categoryId: string) {
    const value = parseFloat(limits[categoryId]);
    if (!value || value <= 0) return;

    setSaving((prev) => ({ ...prev, [categoryId]: true }));

    const { data } = await supabase
      .from("budgets")
      .upsert(
        [{ user_id: userId, category_id: categoryId, monthly_limit: value }],
        { onConflict: "user_id,category_id" }
      )
      .select()
      .single();

    setSaving((prev) => ({ ...prev, [categoryId]: false }));

    if (data) {
      setSavedBudgets((prev) => {
        const others = prev.filter((b) => b.category_id !== categoryId);
        return [...others, data];
      });
    }
  }

  const overBudget = categories.filter((c) => {
    const budget = savedBudgets.find((b) => b.category_id === c.id);
    if (!budget) return false;
    const spent = spendByCategory.get(c.id) || 0;
    return spent > budget.monthly_limit;
  });

  return (
    <div className="space-y-6">
      {overBudget.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">
            ⚠️ Over budget this month
          </p>
          <p className="mt-1 text-sm text-red-600">
            {overBudget.map((c) => c.name).join(", ")} — you&apos;ve gone
            past your set limit.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {categories.map((cat) => {
          const budget = savedBudgets.find((b) => b.category_id === cat.id);
          const spent = spendByCategory.get(cat.id) || 0;
          const limit = budget?.monthly_limit || 0;
          const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
          const isOver = limit > 0 && spent > limit;
          const isNear = limit > 0 && !isOver && pct >= 80;

          return (
            <Card key={cat.id} className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium text-slate-800">
                    {cat.name}
                  </span>
                </div>
                {budget && (
                  <span
                    className={
                      isOver
                        ? "text-sm font-semibold text-red-600"
                        : isNear
                        ? "text-sm font-semibold text-amber-600"
                        : "text-sm text-slate-500"
                    }
                  >
                    ₹{spent.toLocaleString()} / ₹{limit.toLocaleString()}
                  </span>
                )}
              </div>

              {budget && (
                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isOver
                        ? "#dc2626"
                        : isNear
                        ? "#d97706"
                        : cat.color,
                    }}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Set monthly limit (₹)"
                  value={limits[cat.id] || ""}
                  onChange={(e) =>
                    setLimits((prev) => ({
                      ...prev,
                      [cat.id]: e.target.value,
                    }))
                  }
                  className="text-sm"
                />
                <Button
                  onClick={() => saveBudget(cat.id)}
                  disabled={saving[cat.id]}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {saving[cat.id] ? "Saving..." : "Save"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}