"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/theme-provider";
import { AlertCircle, Check, Loader2 } from "lucide-react";

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
  const [savedSuccess, setSavedSuccess] = useState<Record<string, boolean>>({});
  const [savedBudgets, setSavedBudgets] = useState(budgets);

  const { theme } = useTheme();
  const isDark = theme === "dark";
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
      setSavedSuccess((prev) => ({ ...prev, [categoryId]: true }));
      setTimeout(() => {
        setSavedSuccess((prev) => ({ ...prev, [categoryId]: false }));
      }, 2000);
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
      {/* Over Budget Notice */}
      {overBudget.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs shadow-2xs dark:border-rose-500/30 dark:bg-rose-950/30">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400 shrink-0" />
            <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
              Budget Warning: {overBudget.length} {overBudget.length === 1 ? "category" : "categories"} exceeded limit
            </p>
          </div>
          <p className="mt-1 text-xs text-rose-700 dark:text-rose-300/80 pl-6.5">
            {overBudget.map((c) => c.name).join(", ")} — you&apos;ve exceeded your designated monthly cap.
          </p>
        </div>
      )}

      {/* Category Budgets Grid */}
      <div className="space-y-3.5">
        {categories.map((cat) => {
          const budget = savedBudgets.find((b) => b.category_id === cat.id);
          const spent = spendByCategory.get(cat.id) || 0;
          const limit = budget?.monthly_limit || 0;
          const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
          const isOver = limit > 0 && spent > limit;
          const isNear = limit > 0 && !isOver && pct >= 80;

          return (
            <Card
              key={cat.id}
              className="p-5 border-[#E5E6F9] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#11141d] hover:border-[#A4873E]/40 dark:hover:border-[#dfb962]/30 transition"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-bold text-[#333333] dark:text-white text-sm">
                    {cat.name}
                  </span>
                </div>
                {budget ? (
                  <span
                    className={`text-xs font-semibold font-tabular ${
                      isOver
                        ? "text-rose-600 dark:text-rose-400 font-bold"
                        : isNear
                        ? "text-[#A4873E] dark:text-[#dfb962] font-bold"
                        : "text-[#175624] dark:text-[#34d399]"
                    }`}
                  >
                    ₹{spent.toLocaleString("en-IN")} / ₹{limit.toLocaleString("en-IN")}{" "}
                    <span className="font-normal text-slate-400">
                      ({Math.round((spent / limit) * 100)}%)
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    No budget target set
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {budget && (
                <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-[#E5E6F9]/60 dark:bg-white/[0.06]">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isOver
                        ? "#f43f5e"
                        : isNear
                        ? isDark
                          ? "#dfb962"
                          : "#A4873E"
                        : isDark
                        ? "#34d399"
                        : "#175624",
                    }}
                  />
                </div>
              )}

              {/* Budget Limit Form Controls */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                    ₹
                  </span>
                  <Input
                    type="number"
                    placeholder="Monthly limit (₹)"
                    value={limits[cat.id] || ""}
                    onChange={(e) =>
                      setLimits((prev) => ({
                        ...prev,
                        [cat.id]: e.target.value,
                      }))
                    }
                    className="pl-7 text-xs border-[#E5E6F9] dark:border-white/10"
                  />
                </div>
                <Button
                  onClick={() => saveBudget(cat.id)}
                  disabled={saving[cat.id]}
                  size="sm"
                  className="px-4 text-xs font-medium bg-[#175624] text-white hover:bg-[#12441d] dark:bg-[#dfb962] dark:text-[#080e0a] dark:hover:bg-[#eac36e]"
                >
                  {saving[cat.id] ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : savedSuccess[cat.id] ? (
                    <span className="flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Saved
                    </span>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
