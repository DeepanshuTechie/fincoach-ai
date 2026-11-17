"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DashboardNav } from "@/components/dashboard-nav";
import Link from "next/link";
import {
  ArrowLeft,
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Download,
  Sparkles,
  RefreshCw,
  Search,
  Trash2,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Building2,
  Check,
  HelpCircle,
  FileCheck,
} from "lucide-react";
import {
  UniversalTransaction,
  UniversalStatementParseResult,
  commitUniversalTransactionsToFinCoach,
  convertUniversalToCsv,
  triggerUniversalCsvDownload,
  validateStatement,
  parseCsvStatement,
  parseExcelStatement,
} from "@/lib/universal-parser";
import {
  generateSyntheticAxisCsv,
  generateSyntheticPnbWorkbook,
  generateSyntheticSbiTransactions,
  generateSyntheticHdfcTransactions,
  generateSyntheticIciciTransactions,
  generateSyntheticScannedImageTransactions,
  generateSyntheticUnknownBankCsv,
} from "@/lib/universal-parser/test-suite";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  // Extracted and Normalized State
  const [parseResult, setParseResult] = useState<UniversalStatementParseResult | null>(null);
  const [transactions, setTransactions] = useState<UniversalTransaction[]>([]);
  const [filterQuery, setFilterQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "warning" | "error">("all");

  const router = useRouter();
  const supabase = createClient();

  // Handles real file upload via Universal Parser API
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError("");
    setParsing(true);
    setStatus("Inspecting magic bytes and document layout...");

    try {
      const formData = new FormData();
      formData.append("file", selected);

      setStatus("Extracting, standardizing columns and validating balance formulas...");
      const res = await fetch("/api/statement/parse", {
        method: "POST",
        body: formData,
      });

      const data: UniversalStatementParseResult = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to process statement.");
        setParsing(false);
        return;
      }

      setParseResult(data);
      setTransactions(data.transactions);
      setParsing(false);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Upload processing failed";
      setError(msg);
      setParsing(false);
    }
  }

  // Instant Synthetic Bank Statement Loaders (for quick test verification)
  function handleLoadSynthetic(bank: "axis" | "pnb" | "sbi" | "hdfc" | "icici" | "scanned" | "unknown") {
    setError("");
    setParsing(true);
    setStatus(`Loading synthetic ${bank.toUpperCase()} statement verification profile...`);

    setTimeout(() => {
      try {
        let result: UniversalStatementParseResult;
        if (bank === "axis") {
          result = parseCsvStatement(generateSyntheticAxisCsv(), "axis_statement.csv");
        } else if (bank === "pnb") {
          result = parseExcelStatement(generateSyntheticPnbWorkbook(), "pnb_passbook.xlsx");
        } else if (bank === "sbi") {
          result = generateSyntheticSbiTransactions();
        } else if (bank === "hdfc") {
          result = generateSyntheticHdfcTransactions();
        } else if (bank === "icici") {
          result = generateSyntheticIciciTransactions();
        } else if (bank === "scanned") {
          result = generateSyntheticScannedImageTransactions();
        } else {
          result = parseCsvStatement(generateSyntheticUnknownBankCsv(), "custom_bank.csv");
        }

        setParseResult(result);
        setTransactions(result.transactions);
        setParsing(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load sample");
        setParsing(false);
      }
    }, 400);
  }

  // Update a transaction field in-place (Interactive Correction Table)
  function handleUpdateTransaction(id: string, field: keyof UniversalTransaction, value: unknown) {
    setTransactions((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== id) return t;
        const copy = { ...t, [field]: value };
        if (field === "debit" || field === "credit") {
          const d = Number(copy.debit) || 0;
          const c = Number(copy.credit) || 0;
          if (d > 0 || c > 0) {
            copy.status = "verified";
          }
        }
        return copy;
      });

      if (parseResult) {
        const { validation } = validateStatement(updated, parseResult.metadata);
        setParseResult((p) => (p ? { ...p, validation } : p));
      }
      return updated;
    });
  }

  // Remove a transaction row
  function handleDeleteRow(id: string) {
    setTransactions((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      if (parseResult) {
        const { validation } = validateStatement(updated, parseResult.metadata);
        setParseResult((p) => (p ? { ...p, validation } : p));
      }
      return updated;
    });
  }

  // Add an empty manual transaction row
  function handleAddRow() {
    const newTx: UniversalTransaction = {
      id: `tx_${Date.now()}_manual`,
      date: new Date().toISOString().split("T")[0],
      description: "Manual Transaction Entry",
      debit: 0,
      credit: 0,
      balance: null,
      currency: "INR",
      status: "warning",
      confidence: 1.0,
      issues: ["Newly added row; please enter debit or credit amount."],
    };
    setTransactions((prev) => [newTx, ...prev]);
  }

  // Trigger download of standardized RFC 4180 CSV
  function handleDownloadCsv() {
    if (transactions.length === 0) return;
    const csvContent = convertUniversalToCsv(transactions);
    const bank = parseResult?.metadata.bank_name?.toLowerCase().replace(/[^a-z0-9]/g, "-") || "fincoach";
    triggerUniversalCsvDownload(csvContent, `${bank}-standardized.csv`);
  }

  // Commit clean standardized transactions into FinCoach AI ledger
  async function handleCommitToFinCoach() {
    if (transactions.length === 0) return;
    setLoading(true);
    setError("");
    setStatus("Authenticating session & verifying credentials...");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be signed in to commit transactions to your ledger.");
        setLoading(false);
        return;
      }

      setStatus(`Routing ${transactions.length} standardized transactions through FinCoach AI analysis engine...`);
      const result = await commitUniversalTransactionsToFinCoach(supabase, user.id, transactions);

      if (!result.success) {
        setError(result.error || "Failed to commit transactions to your financial ledger.");
        setLoading(false);
        return;
      }

      setStatus("Complete! Redirecting to updated portfolio dashboard...");
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Commit failed");
      setLoading(false);
    }
  }

  // Filtered rows for the review table
  const displayedRows = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.date.includes(filterQuery) ||
      (t.reference_number && t.reference_number.toLowerCase().includes(filterQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fd] text-[#333333] transition-colors duration-200 dark:bg-[#080e0a] dark:text-[#f5f7fa] flex flex-col">
      <DashboardNav />

      <main className="mx-auto flex-1 flex w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#175624] hover:text-[#12441d] dark:text-[#dfb962] dark:hover:text-[#f0cf7e] transition mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#175624] dark:text-white">
              Universal Bank Statement Parser
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Standardizes bank statements from any Indian or international bank into verified FinCoach AI transactions
            </p>
          </div>

          {parseResult && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setParseResult(null);
                setTransactions([]);
                setFile(null);
              }}
              className="gap-1.5 text-xs border-[#E5E6F9] dark:border-white/10"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Upload Different File</span>
            </Button>
          )}
        </div>

        {/* =========================================================================
            STAGE 1: FILE DROPZONE & FORMAT COMPATIBILITY BANNER
           ========================================================================= */}
        {!parseResult && (
          <div className="space-y-6">
            <Card className="p-6 sm:p-8 border-[#E5E6F9] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#11141d]">
              {/* Architecture Info Banner */}
              <div className="mb-6 rounded-2xl border border-[#E5E6F9] bg-[#E5E6F9]/30 p-5 dark:border-white/[0.08] dark:bg-white/[0.02]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-[#175624] dark:text-[#dfb962]" />
                    <span className="font-bold text-sm text-[#175624] dark:text-[#dfb962]">
                      Bank-Agnostic Statement Pipeline:
                    </span>
                  </div>
                  <span className="rounded-full bg-[#175624] px-2.5 py-0.5 text-[11px] font-bold text-white dark:bg-[#dfb962] dark:text-[#080e0a]">
                    PDF · EXCEL · CSV · OCR
                  </span>
                </div>
                <p className="text-xs text-[#333333]/85 leading-relaxed dark:text-slate-300 mb-3.5">
                  Different banks use different column layouts, date formats, and naming conventions (e.g. <em>Withdrawals</em> vs <em>DR Amount</em>). FinCoach AI automatically parses the document, normalizes columns into a universal JSON schema, validates mathematical balance consistency, and lets you inspect and edit before committing.
                </p>

                {/* Format Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="rounded-xl border border-[#E5E6F9] bg-white p-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                    <span className="font-bold text-[#175624] dark:text-[#34d399] block">📄 Digital PDF</span>
                    <span className="text-[10px] text-slate-500">SBI, HDFC, ICICI, etc.</span>
                  </div>
                  <div className="rounded-xl border border-[#E5E6F9] bg-white p-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                    <span className="font-bold text-[#A4873E] dark:text-[#dfb962] block">📊 Excel (.xlsx/.xls)</span>
                    <span className="text-[10px] text-slate-500">Multi-row header detection</span>
                  </div>
                  <div className="rounded-xl border border-[#E5E6F9] bg-white p-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                    <span className="font-bold text-[#333333] dark:text-slate-200 block">📑 CSV / TSV / TXT</span>
                    <span className="text-[10px] text-slate-500">Auto delimiter mapping</span>
                  </div>
                  <div className="rounded-xl border border-[#E5E6F9] bg-white p-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 block">📷 Scanned / Image</span>
                    <span className="text-[10px] text-slate-500">Vision OCR intelligence</span>
                  </div>
                </div>
              </div>

              {/* Upload Drop Area */}
              <div className="mb-6 rounded-2xl border-2 border-dashed border-[#E5E6F9] p-8 text-center transition hover:border-[#A4873E]/60 dark:border-white/10 dark:hover:border-[#dfb962]/40">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E5E6F9] text-[#175624] dark:bg-[#dfb962]/15 dark:text-[#dfb962]">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-[#333333] dark:text-white">
                  Drop your statement here, or browse disk
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Supports .pdf, .xlsx, .xls, .csv, .txt, .png, .jpg (Up to 15MB)
                </p>

                <div className="mt-4 flex justify-center">
                  <label
                    htmlFor="statement-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#175624] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#12441d] dark:bg-[#dfb962] dark:text-[#080e0a] dark:hover:bg-[#eac36e]"
                  >
                    <UploadCloud className="h-4 w-4" />
                    <span>Select Statement File</span>
                    <input
                      id="statement-upload"
                      type="file"
                      accept=".csv, .xlsx, .xls, .pdf, .txt, .tsv, .png, .jpg, .jpeg"
                      onChange={handleFileUpload}
                      disabled={parsing || loading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Parsing Loader */}
              {parsing && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#A4873E]/30 bg-[#A4873E]/10 p-4 text-xs font-semibold text-[#333333] dark:border-[#dfb962]/30 dark:bg-[#dfb962]/10 dark:text-[#dfb962]">
                  <Loader2 className="h-5 w-5 animate-spin text-[#A4873E] dark:text-[#dfb962] shrink-0" />
                  <div>
                    <p className="font-bold">Analyzing Statement Structure</p>
                    <p className="text-[11px] font-normal text-slate-500 dark:text-slate-300">
                      {status || "Standardizing columns & calculating reconciliation formulas..."}
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Synthetic Bank Format Test Buttons */}
              <div className="border-t border-[#E5E6F9] pt-5 dark:border-white/[0.08]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 mb-2.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#A4873E] dark:text-[#dfb962]" />
                  <span>Or test instantly with pre-built synthetic bank layouts:</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => handleLoadSynthetic("sbi")}
                    className="rounded-lg border border-[#E5E6F9] bg-white px-2.5 py-1 font-medium hover:border-[#175624] dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-[#dfb962]"
                  >
                    🏦 SBI PDF Sample
                  </button>
                  <button
                    onClick={() => handleLoadSynthetic("hdfc")}
                    className="rounded-lg border border-[#E5E6F9] bg-white px-2.5 py-1 font-medium hover:border-[#175624] dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-[#dfb962]"
                  >
                    🏦 HDFC PDF Sample
                  </button>
                  <button
                    onClick={() => handleLoadSynthetic("icici")}
                    className="rounded-lg border border-[#E5E6F9] bg-white px-2.5 py-1 font-medium hover:border-[#175624] dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-[#dfb962]"
                  >
                    🏦 ICICI Statement
                  </button>
                  <button
                    onClick={() => handleLoadSynthetic("axis")}
                    className="rounded-lg border border-[#E5E6F9] bg-white px-2.5 py-1 font-medium hover:border-[#175624] dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-[#dfb962]"
                  >
                    📑 Axis Bank CSV
                  </button>
                  <button
                    onClick={() => handleLoadSynthetic("pnb")}
                    className="rounded-lg border border-[#E5E6F9] bg-white px-2.5 py-1 font-medium hover:border-[#175624] dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-[#dfb962]"
                  >
                    📊 PNB Excel (XLSX)
                  </button>
                  <button
                    onClick={() => handleLoadSynthetic("scanned")}
                    className="rounded-lg border border-[#E5E6F9] bg-white px-2.5 py-1 font-medium hover:border-[#175624] dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-[#dfb962]"
                  >
                    📷 Scanned OCR Receipt
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-300">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* =========================================================================
            STAGE 2 & 3: STATEMENT METADATA OVERVIEW & RECONCILIATION SUMMARY
           ========================================================================= */}
        {parseResult && (
          <div className="space-y-6">
            {/* Header Card: Detected Bank & Reconciliation Status */}
            <Card className="p-6 border-[#E5E6F9] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#11141d]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E5E6F9] pb-5 dark:border-white/[0.08]">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E5E6F9] text-[#175624] dark:bg-[#dfb962]/15 dark:text-[#dfb962]">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-[#175624] dark:text-white">
                        {parseResult.metadata.bank_name || "Bank Statement Verified"}
                      </h2>
                      <span className="rounded-md bg-[#E5E6F9] px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-[#175624] dark:bg-white/[0.06] dark:text-[#dfb962]">
                        {parseResult.metadata.detected_file_type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        Period: {parseResult.metadata.statement_period?.start_date || "—"} to{" "}
                        {parseResult.metadata.statement_period?.end_date || "—"}
                      </span>
                      <span>·</span>
                      <span>{parseResult.metadata.file_name}</span>
                    </p>
                  </div>
                </div>

                {/* Reconciliation Badge */}
                <div className="flex items-center gap-2">
                  {parseResult.validation.balance_reconciled ? (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Balance Reconciled ✓</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                      <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span>Check Stated Balances</span>
                    </div>
                  )}

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-white/[0.06] dark:text-slate-300">
                    {Math.round(parseResult.validation.extraction_confidence * 100)}% Confidence
                  </span>
                </div>
              </div>

              {/* 4 Financial Key Metrics */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-5">
                <div className="rounded-xl border border-[#E5E6F9] bg-[#f8f9fd] p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Outflows</span>
                  <p className="mt-1 text-xl font-bold font-tabular text-rose-600 dark:text-rose-400">
                    ₹{parseResult.validation.total_debit.toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-slate-400">{transactions.filter((t) => t.debit > 0).length} debits</span>
                </div>

                <div className="rounded-xl border border-[#E5E6F9] bg-[#f8f9fd] p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Inflows</span>
                  <p className="mt-1 text-xl font-bold font-tabular text-[#175624] dark:text-[#34d399]">
                    ₹{parseResult.validation.total_credit.toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-slate-400">{transactions.filter((t) => t.credit > 0).length} credits</span>
                </div>

                <div className="rounded-xl border border-[#E5E6F9] bg-[#f8f9fd] p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Opening Balance</span>
                  <p className="mt-1 text-xl font-bold font-tabular text-[#333333] dark:text-white">
                    {parseResult.validation.opening_balance !== null
                      ? `₹${parseResult.validation.opening_balance.toLocaleString("en-IN")}`
                      : "—"}
                  </p>
                  <span className="text-[10px] text-slate-400">Statement Start</span>
                </div>

                <div className="rounded-xl border border-[#E5E6F9] bg-[#f8f9fd] p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Closing Balance</span>
                  <p className="mt-1 text-xl font-bold font-tabular text-[#333333] dark:text-white">
                    {parseResult.validation.closing_balance !== null
                      ? `₹${parseResult.validation.closing_balance.toLocaleString("en-IN")}`
                      : "—"}
                  </p>
                  <span className="text-[10px] text-slate-400">Statement End</span>
                </div>
              </div>

              {/* Validation Warnings (if any) */}
              {parseResult.validation.validation_issues.length > 0 && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/20 dark:text-amber-200">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span>Statement Verification Notes ({parseResult.validation.validation_issues.length})</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-800 dark:text-amber-300/80">
                    {parseResult.validation.validation_issues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            {/* =========================================================================
                STAGE 4: INTERACTIVE TRANSACTION REVIEW & EDIT TABLE
               ========================================================================= */}
            <Card className="p-6 border-[#E5E6F9] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#11141d]">
              {/* Filter & Action Toolbar */}
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#333333] dark:text-white">
                    Extracted Transactions ({transactions.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Review and edit any row before committing to FinCoach AI ledger
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddRow}
                    className="h-7 px-2.5 text-xs gap-1 border-[#E5E6F9] dark:border-white/10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Row</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadCsv}
                    className="h-7 px-2.5 text-xs gap-1 border-[#E5E6F9] text-[#175624] dark:border-white/10 dark:text-[#dfb962]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Standard CSV</span>
                  </Button>
                </div>
              </div>

              {/* Search & Status Tabs */}
              <div className="mb-4 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search narrative, date, ref..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="pl-9 text-xs border-[#E5E6F9] dark:border-white/10"
                  />
                </div>

                <div className="flex rounded-lg bg-[#E5E6F9]/50 p-1 text-xs font-semibold dark:bg-white/[0.04]">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`rounded-md px-2.5 py-1 transition ${
                      statusFilter === "all"
                        ? "bg-white text-[#175624] shadow-xs dark:bg-[#dfb962] dark:text-[#080e0a]"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    All ({transactions.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter("verified")}
                    className={`rounded-md px-2.5 py-1 transition ${
                      statusFilter === "verified"
                        ? "bg-white text-[#175624] shadow-xs dark:bg-[#dfb962] dark:text-[#080e0a]"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Verified ({transactions.filter((t) => t.status === "verified").length})
                  </button>
                  <button
                    onClick={() => setStatusFilter("warning")}
                    className={`rounded-md px-2.5 py-1 transition ${
                      statusFilter === "warning"
                        ? "bg-white text-[#175624] shadow-xs dark:bg-[#dfb962] dark:text-[#080e0a]"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Warnings ({transactions.filter((t) => t.status === "warning").length})
                  </button>
                  <button
                    onClick={() => setStatusFilter("error")}
                    className={`rounded-md px-2.5 py-1 transition ${
                      statusFilter === "error"
                        ? "bg-white text-[#175624] shadow-xs dark:bg-[#dfb962] dark:text-[#080e0a]"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Errors ({transactions.filter((t) => t.status === "error").length})
                  </button>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto rounded-xl border border-[#E5E6F9] dark:border-white/[0.06]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8f9fd] text-slate-600 font-bold border-b border-[#E5E6F9] dark:bg-white/[0.04] dark:border-white/[0.06] dark:text-slate-300">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Description / Narrative</th>
                      <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                      <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                      <th className="py-2.5 px-3 text-right">Balance (₹)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E6F9]/60 dark:divide-white/[0.04]">
                    {displayedRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No transactions match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      displayedRows.map((t) => {
                        return (
                          <tr
                            key={t.id}
                            className="hover:bg-[#E5E6F9]/20 dark:hover:bg-white/[0.02] transition-colors"
                          >
                            {/* Date Field */}
                            <td className="py-2 px-3 whitespace-nowrap">
                              <input
                                type="text"
                                value={t.date}
                                onChange={(e) => handleUpdateTransaction(t.id, "date", e.target.value)}
                                className="w-24 rounded border border-transparent bg-transparent px-1 py-0.5 font-mono text-xs focus:border-[#A4873E] focus:bg-white dark:focus:bg-black/40 outline-none"
                              />
                            </td>

                            {/* Description Field */}
                            <td className="py-2 px-3 min-w-[240px]">
                              <input
                                type="text"
                                value={t.description}
                                onChange={(e) => handleUpdateTransaction(t.id, "description", e.target.value)}
                                className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 font-medium text-[#333333] dark:text-white focus:border-[#A4873E] focus:bg-white dark:focus:bg-black/40 outline-none truncate"
                              />
                              {t.payment_method && (
                                <span className="inline-block text-[9px] font-mono text-slate-400 px-1">
                                  {t.payment_method}
                                </span>
                              )}
                            </td>

                            {/* Debit Field */}
                            <td className="py-2 px-3 text-right whitespace-nowrap">
                              <input
                                type="number"
                                step="0.01"
                                value={t.debit || ""}
                                onChange={(e) =>
                                  handleUpdateTransaction(t.id, "debit", parseFloat(e.target.value) || 0)
                                }
                                placeholder="0.00"
                                className="w-20 text-right rounded border border-transparent bg-transparent px-1 py-0.5 font-bold font-tabular text-rose-600 dark:text-rose-400 focus:border-[#A4873E] focus:bg-white dark:focus:bg-black/40 outline-none"
                              />
                            </td>

                            {/* Credit Field */}
                            <td className="py-2 px-3 text-right whitespace-nowrap">
                              <input
                                type="number"
                                step="0.01"
                                value={t.credit || ""}
                                onChange={(e) =>
                                  handleUpdateTransaction(t.id, "credit", parseFloat(e.target.value) || 0)
                                }
                                placeholder="0.00"
                                className="w-20 text-right rounded border border-transparent bg-transparent px-1 py-0.5 font-bold font-tabular text-[#175624] dark:text-[#34d399] focus:border-[#A4873E] focus:bg-white dark:focus:bg-black/40 outline-none"
                              />
                            </td>

                            {/* Balance Field */}
                            <td className="py-2 px-3 text-right whitespace-nowrap">
                              <input
                                type="number"
                                step="0.01"
                                value={t.balance !== null ? t.balance : ""}
                                onChange={(e) =>
                                  handleUpdateTransaction(
                                    t.id,
                                    "balance",
                                    e.target.value !== "" ? parseFloat(e.target.value) : null
                                  )
                                }
                                placeholder="—"
                                className="w-24 text-right rounded border border-transparent bg-transparent px-1 py-0.5 font-medium font-tabular text-slate-700 dark:text-slate-300 focus:border-[#A4873E] focus:bg-white dark:focus:bg-black/40 outline-none"
                              />
                            </td>

                            {/* Status Badge */}
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              {t.status === "verified" ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                  <Check className="h-3 w-3" /> Verified
                                </span>
                              ) : t.status === "warning" ? (
                                <span
                                  title={t.issues?.join("; ")}
                                  className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 cursor-help"
                                >
                                  <AlertCircle className="h-3 w-3" /> Review
                                </span>
                              ) : (
                                <span
                                  title={t.issues?.join("; ")}
                                  className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 cursor-help"
                                >
                                  <AlertCircle className="h-3 w-3" /> Error
                                </span>
                              )}
                            </td>

                            {/* Delete Action */}
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(t.id)}
                                title="Remove row"
                                className="text-slate-400 hover:text-rose-600 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Commit & Submit Action */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E5E6F9] pt-5 dark:border-white/[0.08]">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Ready to commit <strong>{transactions.length} transactions</strong> to your FinCoach financial ledger.
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    onClick={handleCommitToFinCoach}
                    disabled={loading || transactions.length === 0}
                    className="w-full sm:w-auto px-6 py-2.5 font-semibold bg-[#175624] text-white hover:bg-[#12441d] dark:bg-[#dfb962] dark:text-[#080e0a] dark:hover:bg-[#eac36e]"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{status || "Importing to FinCoach AI..."}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" />
                        <span>Commit & Run FinCoach AI Categorization</span>
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
