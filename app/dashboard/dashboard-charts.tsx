"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type Category = {
  id: string;
  name: string;
  color: string;
};

type Transaction = {
  id: string;
  description: string;
  amount: number;
  transaction_date: string;
  category_id: string | null;
  categories: {
    name: string;
    color: string;
  } | null;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [chartView, setChartView] = useState<"category" | "trend">(
    "category"
  );
  const [filterCategoryId, setFilterCategoryId] = useState("");

  const supabase = createClient();


   function handleDownloadPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("FinCoach AI - Spending Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 27);

    doc.setFontSize(12);
    doc.text(`Total Spent: Rs ${totalSpent.toLocaleString()}`, 14, 38);
    doc.text(`Total Income: Rs ${totalIncome.toLocaleString()}`, 14, 45);
    doc.text(`Top Category: ${topCategory?.name || "-"}`, 14, 52);

    autoTable(doc, {
      startY: 60,
      head: [["Date", "Description", "Category", "Amount"]],
      body: txns.map((t) => [
        t.transaction_date,
        t.description,
        t.categories?.name || "Uncategorized",
        `Rs ${Number(t.amount).toLocaleString()}`,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [5, 150, 105] },
    });
    doc.save("fincoach-report.pdf");
  }
  async function updateCategory(
    txnId: string,
    description: string,
    newCategoryId: string
  ) {
    const newCategory = categories.find(
      (category) => category.id === newCategoryId
    );

    setTxns((prev) =>
      prev.map((transaction) =>
        transaction.id === txnId
          ? {
              ...transaction,
              category_id: newCategoryId,
              categories: newCategory
                ? {
                    name: newCategory.name,
                    color: newCategory.color,
                  }
                : null,
            }
          : transaction
      )
    );

    await supabase
      .from("transactions")
      .update({
        category_id: newCategoryId,
      })
      .eq("id", txnId);

    await supabase.from("merchant_memory").upsert(
      [
        {
          user_id: userId,
          description,
          category_id: newCategoryId,
        },
      ],
      {
        onConflict: "user_id,description",
      }
    );
  }

  async function handleDescribeSubmit(
    txnId: string,
    description: string,
    amount: number
  ) {
    const hint = hints[txnId];

    if (!hint || hint.trim() === "") {
      return;
    }

    setThinking((prev) => ({
      ...prev,
      [txnId]: true,
    }));

    try {
      const res = await fetch("/api/recategorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          amount,
          hint,
        }),
      });

      const data = await res.json();

      if (data.category) {
        const matchedCategory = categories.find(
          (category) => category.name === data.category
        );

        if (matchedCategory) {
          await updateCategory(
            txnId,
            description,
            matchedCategory.id
          );
        }
      }
    } catch (error) {
      console.error("Error recategorizing transaction:", error);
    } finally {
      setThinking((prev) => ({
        ...prev,
        [txnId]: false,
      }));
    }
  }

  // Total spent
  const totalSpent = txns
    .filter((transaction) => transaction.categories?.name !== "Income")
    .reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0
    );

  // Total income
  const totalIncome = txns
    .filter((transaction) => transaction.categories?.name === "Income")
    .reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0
    );

  // Category totals
  const categoryTotals = new Map<
    string,
    {
      value: number;
      color: string;
    }
  >();

  txns
    .filter((transaction) => transaction.categories?.name !== "Income")
    .forEach((transaction) => {
      const name = transaction.categories?.name || "Other";
      const color = transaction.categories?.color || "#64748b";

      const existing = categoryTotals.get(name);

      categoryTotals.set(name, {
        value:
          (existing?.value || 0) + Number(transaction.amount),
        color,
      });
    });

  const pieData = Array.from(categoryTotals.entries()).map(
    ([name, { value, color }]) => ({
      name,
      value,
      color,
    })
  );

  // Top spending category
  const topCategory = [...pieData].sort(
    (a, b) => b.value - a.value
  )[0];

  // Daily spending trend
  const dailyTotals = new Map<string, number>();

  txns
    .filter((transaction) => transaction.categories?.name !== "Income")
    .forEach((transaction) => {
      const date = transaction.transaction_date;

      dailyTotals.set(
        date,
        (dailyTotals.get(date) || 0) +
          Number(transaction.amount)
      );
    });

  const trendData = Array.from(dailyTotals.entries())
    .map(([date, amount]) => ({
      date,
      amount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Search + category filter
  const isFiltering =
    searchQuery.trim() !== "" || filterCategoryId !== "";

  const filteredTxns = txns.filter((transaction) => {
    const matchesSearch = transaction.description
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesCategory =
      filterCategoryId === "" ||
      transaction.category_id === filterCategoryId;

    return matchesSearch && matchesCategory;
  });

  // Show 8 normally, max 20 when filtering
  const displayedTxns = isFiltering
    ? filteredTxns.slice(0, 20)
    : txns.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Spent */}
        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Total Spent
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            ₹{totalSpent.toLocaleString()}
          </p>
        </Card>

        {/* Total Income */}
        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Total Income
          </p>

          <p className="mt-1 text-2xl font-bold text-emerald-600">
            ₹{totalIncome.toLocaleString()}
          </p>
        </Card>

        {/* Top Category */}
        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Top Category
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {topCategory?.name || "—"}
          </p>
        </Card>
      </div>

      {/* Charts + Transactions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Spending Chart */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              {chartView === "category"
                ? "Spending by Category"
                : "Spending Trend"}
            </h2>

            <div className="flex gap-1 rounded-md bg-slate-100 p-1">
              <button
                onClick={() => setChartView("category")}
                className={
                  chartView === "category"
                    ? "rounded bg-white px-2.5 py-1 text-xs font-medium text-slate-900 shadow-sm"
                    : "rounded px-2.5 py-1 text-xs font-medium text-slate-500"
                }
              >
                By Category
              </button>

              <button
                onClick={() => setChartView("trend")}
                className={
                  chartView === "trend"
                    ? "rounded bg-white px-2.5 py-1 text-xs font-medium text-slate-900 shadow-sm"
                    : "rounded px-2.5 py-1 text-xs font-medium text-slate-500"
                }
              >
                Trend
              </button>
            </div>
          </div>

          {/* Category Pie Chart */}
          {chartView === "category" ? (
            pieData.length > 0 ? (
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
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value: number) =>
                      `₹${value.toLocaleString()}`
                    }
                  />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400">
                No data yet — upload a statement to see your
                breakdown.
              </p>
            )
          ) : /* Spending Trend */ trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                />

                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                />

                <Tooltip
                  formatter={(value: number) =>
                    `₹${value.toLocaleString()}`
                  }
                />

                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{
                    fill: "#059669",
                    r: 3,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400">
              No data yet — upload a statement to see your
              trend.
            </p>
          )}
        </Card>

        {/* Recent Transactions */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              Recent Transactions
            </h2>

            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-400">✨ Auto-categorized by AI</p>
              <button
                onClick={handleDownloadPDF}
                className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Download PDF
              </button>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="mb-4 flex gap-2">
            <Input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              className="flex-1 text-sm"
            />

            <select
              value={filterCategoryId}
              onChange={(event) =>
                setFilterCategoryId(event.target.value)
              }
              className="rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-600"
            >
              <option value="">All categories</option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtering Information */}
          {isFiltering && (
            <p className="mb-3 text-xs text-slate-400">
              Showing{" "}
              {Math.min(filteredTxns.length, 20)} of{" "}
              {filteredTxns.length} matching transaction
              {filteredTxns.length !== 1 ? "s" : ""}
            </p>
          )}

          {/* Transactions */}
          <div className="space-y-4">
            {displayedTxns.length === 0 && (
              <p className="text-sm text-slate-400">
                No transactions match your search.
              </p>
            )}

            {displayedTxns.map((transaction) => {
              const color =
                transaction.categories?.color || "#64748b";

              const isUnclear =
                !transaction.categories ||
                transaction.categories.name === "Other";

              return (
                <div
                  key={transaction.id}
                  className="border-b border-slate-100 pb-3"
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    {/* Description + Date */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-700">
                        {transaction.description}
                      </p>

                      <p className="text-xs text-slate-400">
                        {transaction.transaction_date}
                      </p>
                    </div>

                    {/* Category Selector */}
                    <select
                      value={transaction.category_id || ""}
                      onChange={(event) =>
                        updateCategory(
                          transaction.id,
                          transaction.description,
                          event.target.value
                        )
                      }
                      style={{
                        backgroundColor: `${color}1a`,
                        color,
                        borderColor: `${color}55`,
                      }}
                      className="cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold"
                    >
                      <option value="" disabled>
                        Select
                      </option>

                      {categories.map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>

                    {/* Amount */}
                    <p
                      className={
                        transaction.categories?.name ===
                        "Income"
                          ? "w-20 shrink-0 text-right font-semibold text-emerald-600"
                          : "w-20 shrink-0 text-right font-semibold text-slate-900"
                      }
                    >
                      ₹
                      {Number(
                        transaction.amount
                      ).toLocaleString()}
                    </p>
                  </div>

                  {/* AI Hint for unclear transactions */}
                  {isUnclear && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="What was this for? e.g. dinner with friends"
                        value={hints[transaction.id] || ""}
                        onChange={(event) =>
                          setHints((prev) => ({
                            ...prev,
                            [transaction.id]:
                              event.target.value,
                          }))
                        }
                        className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs"
                      />

                      <button
                        onClick={() =>
                          handleDescribeSubmit(
                            transaction.id,
                            transaction.description,
                            transaction.amount
                          )
                        }
                        disabled={thinking[transaction.id]}
                        className="rounded bg-slate-800 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                      >
                        {thinking[transaction.id]
                          ? "Thinking..."
                          : "Ask AI"}
                      </button>
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