"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/theme-provider";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  PieChart as PieIcon,
  Download,
  Search,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Loader2,
} from "lucide-react";

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
  const [txns, setTxns] = useState<Transaction[]>(transactions);
  const [hints, setHints] = useState<Record<string, string>>({});
  const [thinking, setThinking] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [chartView, setChartView] = useState<"category" | "trend">("category");
  const [filterCategoryId, setFilterCategoryId] = useState("");

  const { theme } = useTheme();
  const isDark = theme === "dark";
  const supabase = createClient();

  // Total spent (excluding Income)
  const totalSpent = txns
    .filter((transaction) => transaction.categories?.name !== "Income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  // Total income
  const totalIncome = txns
    .filter((transaction) => transaction.categories?.name === "Income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  // Net Savings
  const netSavings = totalIncome - totalSpent;

  // Prestige financial palette adapted for light vs dark mode
  const defaultColors = isDark
    ? [
        "#dfb962", // Radiant Gold
        "#34d399", // Radiant Pine
        "#9ea2ff", // Radiant Periwinkle
        "#f5f7fa", // Clean Alabaster
        "#38bdf8", // Sky Blue
        "#fb923c", // Warm Coral
        "#c084fc", // Radiant Orchid
        "#f43f5e", // Soft Crimson
      ]
    : [
        "#175624", // Deep Forest Pine
        "#A4873E", // Warm Antique Gold
        "#6366f1", // Periwinkle Indigo (contrasts with Lavender Frost)
        "#333333", // Charcoal
        "#059669", // Vivid Emerald
        "#d97706", // Amber
        "#4338ca", // Royal Indigo
        "#be123c", // Crimson
      ];

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
    .forEach((transaction, idx) => {
      const name = transaction.categories?.name || "Other";
      const color =
        transaction.categories?.color ||
        defaultColors[idx % defaultColors.length];

      const existing = categoryTotals.get(name);
      categoryTotals.set(name, {
        value: (existing?.value || 0) + Number(transaction.amount),
        color,
      });
    });

  const pieData = Array.from(categoryTotals.entries())
    .map(([name, { value, color }]) => ({
      name,
      value,
      color,
    }))
    .sort((a, b) => b.value - a.value);

  // Top spending category
  const topCategory = pieData[0];

  // Daily spending trend
  const dailyTotals = new Map<string, number>();

  txns
    .filter((transaction) => transaction.categories?.name !== "Income")
    .forEach((transaction) => {
      const date = transaction.transaction_date;
      dailyTotals.set(
        date,
        (dailyTotals.get(date) || 0) + Number(transaction.amount)
      );
    });

  const trendData = Array.from(dailyTotals.entries())
    .map(([date, amount]) => ({
      date,
      amount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  function handleDownloadPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("FinCoach — Executive Spending Ledger", 14, 22);
    doc.setFontSize(9);
    doc.text(`Generated on ${new Date().toLocaleDateString("en-IN")}`, 14, 29);

    doc.setFontSize(10);
    doc.text(`Total Spent: Rs ${totalSpent.toLocaleString("en-IN")}`, 14, 40);
    doc.text(`Total Inflow: Rs ${totalIncome.toLocaleString("en-IN")}`, 14, 47);
    doc.text(`Net Cashflow: Rs ${netSavings.toLocaleString("en-IN")}`, 14, 54);
    doc.text(`Top Category: ${topCategory?.name || "-"}`, 14, 61);

    autoTable(doc, {
      startY: 70,
      head: [["Date", "Description", "Category", "Amount"]],
      body: txns.map((t) => [
        t.transaction_date,
        t.description,
        t.categories?.name || "Uncategorized",
        `Rs ${Number(t.amount).toLocaleString("en-IN")}`,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [23, 86, 36] }, // #175624 Forest Pine
    });
    doc.save("fincoach-report.pdf");
  }

  async function updateCategory(
    txnId: string,
    description: string,
    newCategoryId: string
  ) {
    const newCategory = categories.find((c) => c.id === newCategoryId);

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
    if (!hint || hint.trim() === "") return;

    setThinking((prev) => ({ ...prev, [txnId]: true }));

    try {
      const res = await fetch("/api/recategorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, amount, hint }),
      });

      const data = await res.json();

      if (data.category) {
        const matchedCategory = categories.find(
          (category) => category.name === data.category
        );

        if (matchedCategory) {
          await updateCategory(txnId, description, matchedCategory.id);
        }
      }
    } catch (error) {
      console.error("Error recategorizing transaction:", error);
    } finally {
      setThinking((prev) => ({ ...prev, [txnId]: false }));
    }
  }

  const isFiltering = searchQuery.trim() !== "" || filterCategoryId !== "";

  const filteredTxns = txns.filter((transaction) => {
    const matchesSearch = transaction.description
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesCategory =
      filterCategoryId === "" || transaction.category_id === filterCategoryId;

    return matchesSearch && matchesCategory;
  });

  const displayedTxns = isFiltering
    ? filteredTxns.slice(0, 25)
    : txns.slice(0, 10);

  return (
    <div className="space-y-8">
      {/* 4 Core Financial Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Spent */}
        <div className="rounded-2xl border border-[#E5E6F9] bg-white p-5 shadow-xs transition hover:border-[#A4873E]/40 dark:border-white/[0.08] dark:bg-[#111a13] dark:hover:border-[#dfb962]/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Outflows
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-[#333333] dark:text-white font-tabular">
            ₹{totalSpent.toLocaleString("en-IN")}
          </p>
          <span className="mt-1 inline-block text-xs text-slate-500 dark:text-slate-400">
            {txns.filter((t) => t.categories?.name !== "Income").length} transactions
          </span>
        </div>

        {/* Total Inflow */}
        <div className="rounded-2xl border border-[#E5E6F9] bg-white p-5 shadow-xs transition hover:border-[#A4873E]/40 dark:border-white/[0.08] dark:bg-[#111a13] dark:hover:border-[#dfb962]/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Inflows
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E5E6F9] text-[#175624] dark:bg-[#34d399]/15 dark:text-[#34d399]">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-[#175624] dark:text-[#34d399] font-tabular">
            ₹{totalIncome.toLocaleString("en-IN")}
          </p>
          <span className="mt-1 inline-block text-xs text-slate-500 dark:text-slate-400">
            Verified credits
          </span>
        </div>

        {/* Net Cashflow */}
        <div className="rounded-2xl border border-[#E5E6F9] bg-white p-5 shadow-xs transition hover:border-[#A4873E]/40 dark:border-white/[0.08] dark:bg-[#111a13] dark:hover:border-[#dfb962]/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Net Cashflow
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#A4873E]/15 text-[#A4873E] dark:bg-[#dfb962]/15 dark:text-[#dfb962]">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p
            className={`mt-3 text-2xl font-bold tracking-tight font-tabular ${
              netSavings >= 0
                ? "text-[#175624] dark:text-[#dfb962]"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {netSavings >= 0 ? "+" : ""}₹{netSavings.toLocaleString("en-IN")}
          </p>
          <span className="mt-1 inline-block text-xs text-slate-500 dark:text-slate-400">
            {netSavings >= 0 ? "Retained surplus" : "Deficit this cycle"}
          </span>
        </div>

        {/* Top Category */}
        <div className="rounded-2xl border border-[#E5E6F9] bg-white p-5 shadow-xs transition hover:border-[#A4873E]/40 dark:border-white/[0.08] dark:bg-[#111a13] dark:hover:border-[#dfb962]/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Largest Category
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#A4873E]/15 text-[#A4873E] dark:bg-[#dfb962]/15 dark:text-[#dfb962]">
              <PieIcon className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-[#333333] dark:text-white truncate">
            {topCategory?.name || "—"}
          </p>
          <span className="mt-1 inline-block text-xs text-slate-500 dark:text-slate-400 font-tabular">
            {topCategory
              ? `₹${topCategory.value.toLocaleString("en-IN")} spent`
              : "No expenditures"}
          </span>
        </div>
      </div>

      {/* Main Charts & Ledger Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Charts Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="rounded-2xl border border-[#E5E6F9] bg-white p-5 shadow-xs dark:border-white/[0.08] dark:bg-[#11141d]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#333333] dark:text-white">
                  Spending Analytics
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Allocation breakdown
                </p>
              </div>

              {/* View Switcher Pills */}
              <div className="flex rounded-lg bg-[#E5E6F9]/60 p-1 dark:bg-white/[0.06]">
                <button
                  onClick={() => setChartView("category")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    chartView === "category"
                      ? "bg-[#175624] text-white shadow-2xs dark:bg-[#dfb962] dark:text-[#080e0a]"
                      : "text-[#333333]/70 hover:text-[#333333] dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  By Category
                </button>
                <button
                  onClick={() => setChartView("trend")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    chartView === "trend"
                      ? "bg-[#175624] text-white shadow-2xs dark:bg-[#dfb962] dark:text-[#080e0a]"
                      : "text-[#333333]/70 hover:text-[#333333] dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  Daily Trend
                </button>
              </div>
            </div>

            {/* Category Donut / Pie View */}
            {chartView === "category" ? (
              pieData.length > 0 ? (
                <div>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={92}
                        paddingAngle={3}
                        stroke={isDark ? "#11141d" : "#ffffff"}
                        strokeWidth={2}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            return (
                              <div className="rounded-xl border border-[#E5E6F9] bg-white p-2.5 text-xs shadow-md dark:border-white/10 dark:bg-[#111a13]">
                                <span className="font-semibold text-[#333333] dark:text-white">
                                  {data.name}
                                </span>
                                <p className="text-[#175624] dark:text-[#dfb962] font-bold mt-0.5 font-tabular">
                                  ₹{Number(data.value).toLocaleString("en-IN")}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Category Legend List */}
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#E5E6F9] dark:border-white/[0.06] pt-3.5">
                    {pieData.slice(0, 6).map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate text-[#333333]/80 dark:text-slate-300 font-medium">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-semibold text-[#333333] dark:text-slate-200 ml-2 font-tabular">
                          ₹{item.value.toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-60 flex-col items-center justify-center text-center text-slate-400">
                  <PieIcon className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs">
                    Upload a bank statement to generate category breakdowns.
                  </p>
                </div>
              )
            ) : trendData.length > 0 ? (
              /* Daily Spending Trend View */
              <ResponsiveContainer width="100%" height={270}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="spendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isDark ? "#dfb962" : "#A4873E"} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={isDark ? "#dfb962" : "#A4873E"} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? "rgba(229,230,249,0.06)" : "#f1f5f9"}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }}
                    stroke={isDark ? "rgba(229,230,249,0.12)" : "#cbd5e1"}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }}
                    stroke={isDark ? "rgba(229,230,249,0.12)" : "#cbd5e1"}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-xl border border-[#E5E6F9] bg-white p-2.5 text-xs shadow-md dark:border-white/10 dark:bg-[#111a13]">
                            <span className="text-slate-500 font-medium">
                              {payload[0].payload.date}
                            </span>
                            <p className="text-[#A4873E] dark:text-[#dfb962] font-bold mt-0.5 font-tabular">
                              ₹{Number(payload[0].value).toLocaleString("en-IN")}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke={isDark ? "#dfb962" : "#A4873E"}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#spendAreaGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-60 flex-col items-center justify-center text-center text-slate-400">
                <TrendingUp className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs">
                  No trend data available for this range.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Ledger Column (7 cols) */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-[#E5E6F9] bg-white p-5 shadow-xs dark:border-white/[0.08] dark:bg-[#11141d]">
            {/* Header */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#333333] dark:text-white">
                  Transactions Ledger
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Classified via AI · Edit category to update memory
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleDownloadPDF}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs border-[#E5E6F9] hover:bg-[#E5E6F9]/40 dark:border-white/10 dark:hover:bg-white/[0.06]"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export PDF</span>
                </Button>
              </div>
            </div>

            {/* Search & Category Filter Controls */}
            <div className="mb-3.5 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search merchant or narrative..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs border-[#E5E6F9] dark:border-white/10"
                />
              </div>

              <select
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(e.target.value)}
                className="rounded-xl border border-[#E5E6F9] bg-white px-3 py-1.5 text-xs font-medium text-[#333333] outline-none focus:border-[#A4873E] transition dark:border-white/10 dark:bg-[#080e0a] dark:text-slate-300 dark:focus:border-[#dfb962]"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Count Info */}
            {isFiltering && (
              <p className="mb-2.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Displaying {Math.min(filteredTxns.length, 25)} of{" "}
                {filteredTxns.length} matching entries
              </p>
            )}

            {/* Transaction Rows */}
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {displayedTxns.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No records match your search or filter.
                </div>
              ) : (
                displayedTxns.map((transaction) => {
                  const isIncome =
                    transaction.categories?.name === "Income";
                  const color =
                    transaction.categories?.color || (isDark ? "#dfb962" : "#A4873E");
                  const isUnclear =
                    !transaction.categories ||
                    transaction.categories.name === "Other";

                  return (
                    <div
                      key={transaction.id}
                      className="group rounded-xl border border-[#E5E6F9]/70 bg-[#f8f9fd]/70 p-3 transition hover:bg-[#E5E6F9]/30 dark:border-white/[0.04] dark:bg-white/[0.02] dark:hover:bg-white/[0.05]"
                    >
                      <div className="flex items-center justify-between gap-3 text-sm">
                        {/* Transaction Name & Date */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-[#333333] dark:text-white">
                            {transaction.description}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {transaction.transaction_date}
                          </p>
                        </div>

                        {/* Category Dropdown Pill */}
                        <div className="relative shrink-0">
                          <select
                            value={transaction.category_id || ""}
                            onChange={(e) =>
                              updateCategory(
                                transaction.id,
                                transaction.description,
                                e.target.value
                              )
                            }
                            style={{
                              backgroundColor: `${color}18`,
                              color: color,
                              borderColor: `${color}40`,
                            }}
                            className="cursor-pointer rounded-full border px-2.5 py-0.5 text-[11px] font-semibold appearance-none pr-5 transition hover:brightness-95 outline-none"
                          >
                            <option value="" disabled>
                              Select
                            </option>
                            {categories.map((cat) => (
                              <option
                                key={cat.id}
                                value={cat.id}
                                className="bg-white text-[#333333] dark:bg-[#0c0f16] dark:text-white"
                              >
                                {cat.name}
                              </option>
                            ))}
                          </select>
                          <span
                            className="pointer-events-none absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        </div>

                        {/* Amount */}
                        <div className="w-24 text-right">
                          <p
                            className={`font-bold tracking-tight text-sm font-tabular ${
                              isIncome
                                ? "text-[#175624] dark:text-[#34d399]"
                                : "text-[#333333] dark:text-white"
                            }`}
                          >
                            {isIncome ? "+" : ""}₹
                            {Number(transaction.amount).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>

                      {/* AI Re-categorize Hint Drawer */}
                      {isUnclear && (
                        <div className="mt-2.5 flex items-center gap-2 border-t border-[#E5E6F9]/70 pt-2 dark:border-white/[0.04]">
                          <input
                            type="text"
                            placeholder="Add merchant context (e.g. airport taxi)..."
                            value={hints[transaction.id] || ""}
                            onChange={(e) =>
                              setHints((prev) => ({
                                ...prev,
                                [transaction.id]: e.target.value,
                              }))
                            }
                            className="flex-1 rounded-lg border border-[#E5E6F9] bg-white px-2.5 py-1 text-xs text-[#333333] placeholder:text-slate-400 outline-none focus:border-[#A4873E] dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#dfb962]"
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
                            className="inline-flex items-center gap-1 rounded-lg bg-[#175624] px-2.5 py-1 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#12441d] disabled:opacity-50 dark:bg-[#dfb962] dark:text-[#080e0a] dark:hover:bg-[#eac36e]"
                          >
                            {thinking[transaction.id] ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Classifying...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3" />
                                <span>Re-classify</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
