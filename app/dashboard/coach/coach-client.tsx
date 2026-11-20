"use client";

import { useState, useMemo } from "react";
import {
  calculateFinScore,
  simulateAffordability,
  FinScoreResult,
  AffordabilitySimulation,
  CoachActionPlan,
} from "@/lib/coach-engine";
import {
  generateFullCAAudit,
  FullCAAuditReport,
} from "@/lib/ca-engine";
import { AVAILABLE_FISCAL_YEARS, DEFAULT_FISCAL_YEAR } from "@/lib/tax-rules";
import { generateAndDownloadCAPdf } from "@/lib/ca-pdf-generator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Loader2,
  DollarSign,
  Compass,
  Check,
  Download,
  FileText,
  Landmark,
  PieChart,
  Briefcase,
  HelpCircle,
  Send,
  Lock,
} from "lucide-react";
import {
  Visual3DShield,
  Visual3DAIBrain,
  Visual3DProductIcon,
} from "@/components/ui/fintech-3d-visuals";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface RawTxn {
  id: string;
  description: string;
  amount: number;
  transaction_date: string;
  category_id?: string | null;
  categories?: { name: string; color?: string } | null;
}

interface CoachClientProps {
  transactions: RawTxn[];
  initialPlan: CoachActionPlan;
}

const PRESETS = [
  { name: "iPhone 16", cost: 79900, emi: 6 },
  { name: "MacBook Air M3", cost: 99900, emi: 9 },
  { name: "Goa Vacation", cost: 24000, emi: 3 },
  { name: "Sony WH-1000XM5", cost: 22990, emi: 3 },
  { name: "Electric Scooter", cost: 115000, emi: 12 },
];

export function CoachClient({ transactions, initialPlan }: CoachClientProps) {
  // Navigation: "coach" (Simulator & Drills) vs "ca" (Chartered Advisory & Tax)
  const [activeTab, setActiveTab] = useState<"coach" | "ca">("coach");

  // 1. Core Financial Score Engine
  const finScore: FinScoreResult = useMemo(
    () => calculateFinScore(transactions),
    [transactions]
  );

  // Fiscal Year State for Dynamic Indian Tax Rules
  const [fiscalYears, setFiscalYears] = useState<string[]>(AVAILABLE_FISCAL_YEARS);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>(DEFAULT_FISCAL_YEAR);
  const [isSyncingBudget, setIsSyncingBudget] = useState(false);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  // 2. Comprehensive CA & Tax Audit Engine
  const caAudit: FullCAAuditReport = useMemo(
    () => generateFullCAAudit(transactions, selectedFiscalYear),
    [transactions, selectedFiscalYear]
  );

  async function handleAutonomousBudgetSync() {
    setIsSyncingBudget(true);
    setSyncNotification(null);
    try {
      const res = await fetch("/api/ca/sync-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetYear: "FY 2026-27" }),
      });
      const data = await res.json();
      if (data.success && data.fiscalYear) {
        setFiscalYears((prev) => {
          if (!prev.includes(data.fiscalYear)) {
            return [data.fiscalYear, ...prev];
          }
          return prev;
        });
        setSelectedFiscalYear(data.fiscalYear);
        setSyncNotification(data.message || `Autonomous AI calibrated ${data.fiscalYear}!`);
        setTimeout(() => setSyncNotification(null), 8000);
      } else {
        alert(data.error || "Autonomous sync failed");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while syncing budget");
    } finally {
      setIsSyncingBudget(false);
    }
  }

  // 3. Affordability What-If Simulator State
  const [itemName, setItemName] = useState("iPhone 16");
  const [itemCost, setItemCost] = useState(79900);
  const [isEmi, setIsEmi] = useState(true);
  const [emiMonths, setEmiMonths] = useState(6);

  const estimatedBalance = useMemo(() => {
    return Math.max(
      35000,
      finScore.metrics.monthlyIncome - finScore.metrics.monthlyExpense + 25000
    );
  }, [finScore]);

  const simulation: AffordabilitySimulation = useMemo(() => {
    return simulateAffordability(
      transactions,
      estimatedBalance,
      itemName,
      itemCost,
      isEmi,
      emiMonths
    );
  }, [transactions, estimatedBalance, itemName, itemCost, isEmi, emiMonths]);

  // 4. AI Persona State
  const [persona, setPersona] = useState<"shark" | "buffett" | "zen">("shark");
  const [plan, setPlan] = useState<CoachActionPlan>(initialPlan);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [completedMissions, setCompletedMissions] = useState<Record<number, boolean>>({});

  // 5. Interactive CA Consultation State
  const [caQuery, setCaQuery] = useState("");
  const [caAnswer, setCaAnswer] = useState<string | null>(null);
  const [loadingCa, setLoadingCa] = useState(false);

  async function handleSwitchPersona(newPersona: "shark" | "buffett" | "zen") {
    if (newPersona === persona) return;
    setPersona(newPersona);
    setLoadingPlan(true);

    try {
      const res = await fetch("/api/coach/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: newPersona }),
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setPlan(data.plan);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPlan(false);
    }
  }

  function toggleMission(idx: number) {
    setCompletedMissions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  async function handleAskCA(customQuery?: string) {
    const q = customQuery || caQuery;
    if (!q.trim()) return;
    setLoadingCa(true);
    setCaAnswer(null);

    try {
      const res = await fetch("/api/ca/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, fiscalYear: selectedFiscalYear }),
      });
      const data = await res.json();
      if (data.success && data.response) {
        setCaAnswer(data.response);
      }
    } catch (err) {
      console.error(err);
      setCaAnswer(
        "Consultation temporarily unavailable. Please verify network connection or try again."
      );
    } finally {
      setLoadingCa(false);
    }
  }

  function handleDownloadPDF() {
    generateAndDownloadCAPdf("DIPANSHU SHARMA", finScore, caAudit);
  }

  return (
    <div className="space-y-8 pb-12">
      {/* =========================================================================
          TOP SUITE SWITCHER & ACTION BAR
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E6F9] pb-4 dark:border-white/[0.08]">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 rounded-xl bg-[#E5E6F9]/60 p-1.5 dark:bg-white/[0.06]">
          <button
            type="button"
            onClick={() => setActiveTab("coach")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === "coach"
                ? "bg-[#175624] text-white shadow-xs dark:bg-[#dfb962] dark:text-[#080e0a]"
                : "text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>AI Coach &amp; Simulator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ca")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === "ca"
                ? "bg-[#175624] text-white shadow-xs dark:bg-[#dfb962] dark:text-[#080e0a]"
                : "text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
            }`}
          >
            <Landmark className="h-4 w-4" />
            <span>Personal AI CA &amp; Tax Suite</span>
          </button>
        </div>

        {/* Right Action Cluster: Fiscal Year Selector, AI Auto-Sync & PDF Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tax Year Dropdown */}
          <div className="flex items-center gap-2 rounded-xl border border-[#E5E6F9] bg-[#f8f9fd] px-3 py-1.5 dark:border-white/10 dark:bg-white/[0.04]">
            <Calendar className="h-3.5 w-3.5 text-[#175624] dark:text-[#dfb962]" />
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Tax Year:
            </span>
            <select
              value={selectedFiscalYear}
              onChange={(e) => setSelectedFiscalYear(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#175624] dark:text-[#dfb962] outline-none cursor-pointer"
            >
              {fiscalYears.map((fy) => (
                <option key={fy} value={fy} className="bg-white text-slate-900 dark:bg-[#11141d] dark:text-white">
                  {fy} {fy === "FY 2026-27" ? "(AI Auto-Calibrated)" : fy === "FY 2025-26" ? "(Budget 2025)" : "(Finance Act 2024)"}
                </option>
              ))}
            </select>
          </div>

          {/* AI Autonomous Ingestion Button */}
          <button
            type="button"
            onClick={handleAutonomousBudgetSync}
            disabled={isSyncingBudget}
            className="flex items-center gap-1.5 rounded-xl border border-[#A4873E]/40 bg-[#dfb962]/15 px-3 py-1.5 text-xs font-bold text-[#175624] transition hover:bg-[#dfb962]/30 dark:border-[#dfb962]/40 dark:text-[#dfb962] disabled:opacity-60 cursor-pointer shadow-2xs"
            title="Auto-trigger Gemini AI to ingest forward Union Budget gazette rules"
          >
            {isSyncingBudget ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#A4873E] dark:text-[#dfb962]" />
                <span>Ingesting Budget...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-[#A4873E] dark:text-[#dfb962]" />
                <span className="hidden sm:inline">AI Auto-Sync Budget</span>
                <span className="sm:hidden">AI Sync</span>
              </>
            )}
          </button>

          {/* Export Official CA Audit PDF Button */}
          <Button
            type="button"
            onClick={handleDownloadPDF}
            className="gap-2 text-xs font-bold bg-[#A4873E] text-white hover:bg-[#8e7332] dark:bg-[#dfb962] dark:text-[#080e0a] dark:hover:bg-[#eac36e] shadow-xs"
          >
            <Download className="h-4 w-4" />
            <span className="hidden md:inline">Download CA Audit Report (PDF)</span>
            <span className="md:hidden">CA PDF</span>
          </Button>
        </div>
      </div>

      {/* Autonomous Ingestion Notification Banner */}
      {syncNotification && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-between gap-2 animate-fade-in-up shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{syncNotification}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-extrabold bg-emerald-200/60 dark:bg-emerald-800/40 px-2 py-0.5 rounded-md">
            Active Now
          </span>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: AI FINANCIAL COACH & WHAT-IF SIMULATOR
         ========================================================================= */}
      {activeTab === "coach" && (
        <div className="space-y-8">
          {/* SECTION 1: AI FINANCIAL HEALTH SCORE (FINSCORE 0-1000) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-5 p-6 sm:p-7 border-[#E5E6F9] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#111a13] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 h-32 w-32 bg-[#A4873E]/10 rounded-full blur-3xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    FinCoach Health Diagnostic
                  </span>
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-extrabold ${
                      finScore.grade === "A+" || finScore.grade === "A"
                        ? "bg-[#175624]/15 text-[#175624] dark:bg-[#34d399]/20 dark:text-[#34d399]"
                        : finScore.grade === "B"
                        ? "bg-[#A4873E]/15 text-[#A4873E] dark:bg-[#dfb962]/20 dark:text-[#dfb962]"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                    }`}
                  >
                    Grade {finScore.grade}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-5xl sm:text-6xl font-black tracking-tight text-[#175624] dark:text-[#dfb962] font-tabular">
                        {finScore.score}
                      </span>
                      <span className="text-sm font-semibold text-slate-400">/ 1000</span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed max-w-[260px]">
                      {finScore.statusText}
                    </p>
                  </div>
                  <div className="hidden sm:block shrink-0">
                    <Visual3DShield className="h-16 w-16" />
                  </div>
                </div>
              </div>

              {/* Quick Metrics Pills */}
              <div className="mt-6 grid grid-cols-3 gap-2 border-t border-[#E5E6F9] pt-4 dark:border-white/[0.08] text-center">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Savings Rate
                  </span>
                  <span className="text-sm font-bold text-[#175624] dark:text-[#34d399]">
                    {finScore.metrics.savingsRatePercent}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Daily Burn
                  </span>
                  <span className="text-sm font-bold text-[#A4873E] dark:text-[#dfb962]">
                    ₹{finScore.metrics.burnRatePerDay.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Cash Runway
                  </span>
                  <span className="text-sm font-bold text-[#333333] dark:text-white">
                    {finScore.metrics.runwayDays} Days
                  </span>
                </div>
              </div>
            </Card>

            {/* 5-Factor Score Breakdown */}
            <Card className="lg:col-span-7 p-6 sm:p-7 border-[#E5E6F9] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#11141d] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#333333] dark:text-white">
                    5-Pillar Health Score Breakdown
                  </h3>
                  <span className="text-[11px] font-medium text-slate-400">
                    Algorithmic evaluation of your statement
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700 dark:text-slate-200">
                        1. Savings Rate Ratio (Target &gt; 25%)
                      </span>
                      <span className="font-tabular text-[#175624] dark:text-[#34d399]">
                        {finScore.breakdown.savingsRateScore} / 300
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#E5E6F9] dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#175624] dark:bg-[#34d399] transition-all duration-500"
                        style={{
                          width: `${(finScore.breakdown.savingsRateScore / 300) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700 dark:text-slate-200">
                        2. 50/30/20 Rule Adherence (Needs vs Wants)
                      </span>
                      <span className="font-tabular text-[#A4873E] dark:text-[#dfb962]">
                        {finScore.breakdown.essentialRatioScore} / 250
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#E5E6F9] dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#A4873E] dark:bg-[#dfb962] transition-all duration-500"
                        style={{
                          width: `${(finScore.breakdown.essentialRatioScore / 250) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700 dark:text-slate-200">
                        3. Impulse &amp; Dining Discipline
                      </span>
                      <span className="font-tabular text-slate-800 dark:text-white">
                        {finScore.breakdown.discretionaryDiscipline} / 200
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#E5E6F9] dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#333333] dark:bg-slate-300 transition-all duration-500"
                        style={{
                          width: `${(finScore.breakdown.discretionaryDiscipline / 200) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700 dark:text-slate-200">
                        4. Recurring Autopay Burden (&lt; 8% of Inflow)
                      </span>
                      <span className="font-tabular text-[#175624] dark:text-[#dfb962]">
                        {finScore.breakdown.subscriptionBurdenScore} / 150
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#E5E6F9] dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#175624] dark:bg-[#dfb962] transition-all duration-500"
                        style={{
                          width: `${(finScore.breakdown.subscriptionBurdenScore / 150) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700 dark:text-slate-200">
                        5. Net Monthly Retention Buffer
                      </span>
                      <span className="font-tabular text-emerald-600 dark:text-emerald-400">
                        {finScore.breakdown.emergencyBufferScore} / 100
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#E5E6F9] dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400 transition-all duration-500"
                        style={{
                          width: `${(finScore.breakdown.emergencyBufferScore / 100) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5E6F9] dark:border-white/[0.08] flex items-center justify-between text-[11px] text-slate-500">
                <span>Needs: {finScore.metrics.needsRatioPercent}%</span>
                <span>Wants: {finScore.metrics.wantsRatioPercent}%</span>
                <span>Savings: {finScore.metrics.savingsRatePercent}%</span>
              </div>
            </Card>
          </div>

          {/* SECTION 2: "CAN I AFFORD THIS?" WHAT-IF SCENARIO SIMULATOR */}
          <Card className="p-6 sm:p-8 border-[#E5E6F9] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#11141d]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#175624] text-white dark:bg-[#dfb962] dark:text-[#080e0a]">
                    <Compass className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-bold text-[#175624] dark:text-white">
                    &ldquo;Can I Afford This?&rdquo; — What-If Decision Engine
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Simulate high-ticket purchases, EMI impact, and cashflow runways over the next 6 months before spending
                </p>
              </div>

              {/* Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Presets:</span>
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setItemName(p.name);
                      setItemCost(p.cost);
                      setIsEmi(true);
                      setEmiMonths(p.emi);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      itemName === p.name && itemCost === p.cost
                        ? "bg-[#175624] text-white dark:bg-[#dfb962] dark:text-[#080e0a]"
                        : "border border-[#E5E6F9] bg-[#f8f9fd] text-[#333333] hover:border-[#A4873E] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulator Controls */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-4 rounded-2xl border border-[#E5E6F9] bg-[#f8f9fd]/60 p-5 dark:border-white/[0.08] dark:bg-white/[0.02] mb-6">
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Purchase or Goal Name
                </Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <Visual3DProductIcon name={itemName} className="h-9 w-9 shrink-0" />
                  <Input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. iPhone 16"
                    className="text-xs bg-white dark:bg-[#111a13]"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Total Amount (₹)
                </Label>
                <Input
                  type="number"
                  step="500"
                  value={itemCost}
                  onChange={(e) => setItemCost(Math.max(0, Number(e.target.value)))}
                  className="mt-1.5 text-xs bg-white dark:bg-[#111a13] font-tabular font-bold"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Payment Structure
                </Label>
                <div className="mt-1.5 flex rounded-lg bg-[#E5E6F9]/60 p-1 dark:bg-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setIsEmi(false)}
                    className={`flex-1 rounded-md py-1 text-xs font-semibold transition ${
                      !isEmi
                        ? "bg-white text-[#175624] shadow-xs dark:bg-[#dfb962] dark:text-[#080e0a]"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Upfront Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEmi(true)}
                    className={`flex-1 rounded-md py-1 text-xs font-semibold transition ${
                      isEmi
                        ? "bg-white text-[#175624] shadow-xs dark:bg-[#dfb962] dark:text-[#080e0a]"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    No-Cost EMI
                  </button>
                </div>
              </div>

              {isEmi && (
                <div>
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      EMI Tenure: {emiMonths} Mo
                    </Label>
                    <span className="text-[11px] font-bold text-[#175624] dark:text-[#dfb962]">
                      ₹{Math.round(itemCost / emiMonths).toLocaleString("en-IN")}/mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="24"
                    step="3"
                    value={emiMonths}
                    onChange={(e) => setEmiMonths(Number(e.target.value))}
                    className="mt-2 w-full accent-[#175624] dark:accent-[#dfb962]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>3 Mo</span>
                    <span>6 Mo</span>
                    <span>12 Mo</span>
                    <span>24 Mo</span>
                  </div>
                </div>
              )}
            </div>

            {/* Simulation Chart */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  6-Month Projected Cashflow Runway
                </h4>
                <p className="text-[11px] text-slate-500">
                  Green: Baseline Cadence · Gold: Balance With &quot;{itemName}&quot;
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#175624] dark:bg-[#34d399]" />
                  <span className="text-slate-600 dark:text-slate-400">Baseline Balance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#A4873E] dark:bg-[#dfb962]" />
                  <span className="text-slate-600 dark:text-slate-400">With Purchase</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulation.timeline}>
                  <defs>
                    <linearGradient id="baselineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#175624" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#175624" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A4873E" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#A4873E" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [
                      `₹${Number(val).toLocaleString("en-IN")}`,
                      "",
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #E5E6F9",
                      fontSize: "12px",
                    }}
                  />
                  <ReferenceLine
                    y={simulation.timeline[0]?.safetyThreshold || 15000}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{
                      value: "Safety Buffer Floor",
                      position: "insideBottomRight",
                      fill: "#ef4444",
                      fontSize: 10,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="baselineBalance"
                    stroke="#175624"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#baselineGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="projectedBalance"
                    stroke="#A4873E"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#projectedGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Simulation Verdict Box */}
            <div
              className={`mt-6 rounded-2xl border p-5 ${
                simulation.verdict === "safe"
                  ? "border-[#175624]/30 bg-[#175624]/5 dark:border-[#34d399]/30 dark:bg-[#34d399]/5"
                  : simulation.verdict === "caution"
                  ? "border-[#A4873E]/30 bg-[#A4873E]/5 dark:border-[#dfb962]/30 dark:bg-[#dfb962]/5"
                  : "border-rose-200 bg-rose-50/60 dark:border-rose-500/30 dark:bg-rose-950/20"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {simulation.verdict === "safe" ? (
                    <ShieldCheck className="h-5 w-5 text-[#175624] dark:text-[#34d399]" />
                  ) : simulation.verdict === "caution" ? (
                    <AlertTriangle className="h-5 w-5 text-[#A4873E] dark:text-[#dfb962]" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  )}
                  <h3 className="text-sm font-bold text-[#333333] dark:text-white">
                    {simulation.headline}
                  </h3>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                    simulation.verdict === "safe"
                      ? "bg-[#175624] text-white dark:bg-[#34d399] dark:text-black"
                      : simulation.verdict === "caution"
                      ? "bg-[#A4873E] text-white dark:bg-[#dfb962] dark:text-black"
                      : "bg-rose-600 text-white"
                  }`}
                >
                  Verdict: {simulation.verdict}
                </span>
              </div>
              <p className="text-xs text-[#333333]/85 dark:text-slate-300 leading-relaxed mb-3">
                {simulation.explanation}
              </p>
              <div className="rounded-xl border border-white/60 bg-white/80 p-3 text-xs dark:border-white/10 dark:bg-white/[0.04]">
                <strong className="text-[#175624] dark:text-[#dfb962]">Coach Strategy:</strong>{" "}
                {simulation.coachAdvice}
              </div>
            </div>
          </Card>

          {/* SECTION 3: AI COACH PERSONA & ACTIVE WEEKLY DRILLS */}
          <Card className="p-6 sm:p-8 border-[#E5E6F9] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#11141d]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Visual3DAIBrain className="h-11 w-11 shrink-0 hidden sm:block" />
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#A4873E] dark:text-[#dfb962]" />
                    <h2 className="text-lg font-bold text-[#175624] dark:text-white">
                      AI Coach Persona &amp; Weekly Action Drills
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Select your preferred coaching tone to synthesize customized tactical missions
                  </p>
                </div>
              </div>

              {/* Persona Switcher */}
              <div className="flex rounded-xl bg-[#E5E6F9]/60 p-1.5 dark:bg-white/[0.06]">
                <button
                  onClick={() => handleSwitchPersona("shark")}
                  disabled={loadingPlan}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                    persona === "shark"
                      ? "bg-[#175624] text-white shadow-xs dark:bg-[#dfb962] dark:text-[#080e0a]"
                      : "text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  <Flame className="h-3.5 w-3.5" />
                  <span>Shark Tank</span>
                </button>
                <button
                  onClick={() => handleSwitchPersona("buffett")}
                  disabled={loadingPlan}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                    persona === "buffett"
                      ? "bg-[#175624] text-white shadow-xs dark:bg-[#dfb962] dark:text-[#080e0a]"
                      : "text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Warren Buffett</span>
                </button>
                <button
                  onClick={() => handleSwitchPersona("zen")}
                  disabled={loadingPlan}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                    persona === "zen"
                      ? "bg-[#175624] text-white shadow-xs dark:bg-[#dfb962] dark:text-[#080e0a]"
                      : "text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Zen Money</span>
                </button>
              </div>
            </div>

            {/* Persona Headline Banner */}
            <div className="mb-6 rounded-2xl border border-[#A4873E]/30 bg-[#A4873E]/10 p-4 text-xs font-semibold text-[#333333] dark:border-[#dfb962]/30 dark:bg-[#dfb962]/10 dark:text-[#dfb962] flex items-center gap-3">
              {loadingPlan ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#A4873E] dark:text-[#dfb962] shrink-0" />
              ) : (
                <Sparkles className="h-5 w-5 text-[#A4873E] dark:text-[#dfb962] shrink-0" />
              )}
              <p className="leading-relaxed">
                {loadingPlan
                  ? "Synthesizing custom drills from your latest statement with Gemini AI..."
                  : plan.headline}
              </p>
            </div>

            {/* Weekly Missions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {plan.weeklyMissions.map((m, idx) => {
                const isDone = completedMissions[idx];
                return (
                  <div
                    key={m.title}
                    onClick={() => toggleMission(idx)}
                    className={`cursor-pointer rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                      isDone
                        ? "border-[#175624] bg-[#175624]/5 dark:border-[#34d399] dark:bg-[#34d399]/10"
                        : "border-[#E5E6F9] bg-[#f8f9fd] hover:border-[#A4873E] dark:border-white/10 dark:bg-white/[0.03]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs dark:bg-white/10 dark:text-slate-300">
                          {m.category}
                        </span>
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                            isDone
                              ? "border-[#175624] bg-[#175624] text-white dark:border-[#34d399] dark:bg-[#34d399] dark:text-black"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>

                      <h4
                        className={`text-sm font-bold tracking-tight ${
                          isDone
                            ? "line-through text-slate-400 dark:text-slate-500"
                            : "text-[#333333] dark:text-white"
                        }`}
                      >
                        {m.title}
                      </h4>
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {m.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E5E6F9] dark:border-white/[0.08] flex items-center justify-between text-xs">
                      <span className="font-bold text-[#175624] dark:text-[#34d399]">
                        +₹{m.potentialSavings.toLocaleString("en-IN")}/mo
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {m.difficulty}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Opportunity Cost Compounding Footer */}
            <div className="rounded-xl border border-[#E5E6F9] bg-white p-4 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-[#111a13] dark:text-slate-300 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-[#175624] dark:text-[#dfb962] shrink-0" />
              <p>
                <strong className="text-[#175624] dark:text-[#dfb962]">Compounding Reality:</strong>{" "}
                {plan.opportunityCostNote}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: CHARTERED ADVISORY & INDIAN TAX SUITE (AI CA)
         ========================================================================= */}
      {activeTab === "ca" && (
        <div className="space-y-8 animate-fade-in-up">
          {/* CA Executive Dossier Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border-[#E5E6F9] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#11141d]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Estimated Annual Inflow
              </span>
              <span className="text-xl font-black text-[#175624] dark:text-white font-tabular block mt-1">
                ₹{caAudit.taxAudit.estimatedAnnualIncome.toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Based on annualized statement inflows
              </span>
            </Card>

            <Card className="p-5 border-[#E5E6F9] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#11141d]">
              <span className="text-[10px] uppercase font-bold text-[#A4873E] dark:text-[#dfb962] block">
                Untapped Tax Deductions
              </span>
              <span className="text-xl font-black text-[#A4873E] dark:text-[#dfb962] font-tabular block mt-1">
                ₹{caAudit.taxAudit.untappedDeductions.totalUntapped.toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Under Sec 80C, 80D &amp; 80CCD
              </span>
            </Card>

            <Card className="p-5 border-[#E5E6F9] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#11141d]">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                Potential Tax Savings
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-tabular block mt-1">
                ₹{caAudit.taxAudit.taxSavingsPotential.toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Direct tax refund / reduction room
              </span>
            </Card>

            <Card className="p-5 border-[#E5E6F9] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#11141d]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Recommended Tax Regime
              </span>
              <span className="text-sm font-extrabold text-[#175624] dark:text-white block mt-1">
                {caAudit.taxAudit.recommendedRegime}
              </span>
              <span className="text-[11px] text-[#A4873E] dark:text-[#dfb962] mt-0.5 block font-semibold">
                Mathematically optimized choice
              </span>
            </Card>
          </div>

          {/* SECTION A: INDIAN TAX DEDUCTIONS BREAKDOWN */}
          <Card className="p-6 sm:p-8 border-[#E5E6F9] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#11141d]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#175624] text-[#dfb962] shadow-xs">
                  <Landmark className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#175624] dark:text-white">
                    Indian Income Tax Deduction Audit ({caAudit.taxAudit.fiscalYear})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {caAudit.taxAudit.budgetAnnouncement}
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-[#175624]/20 bg-[#175624]/10 px-3 py-1 text-xs font-bold text-[#175624] dark:border-[#dfb962]/30 dark:bg-[#dfb962]/10 dark:text-[#dfb962]">
                {caAudit.taxAudit.recommendedRegime}
              </span>
            </div>

            {/* Regime Explanation Banner */}
            <div className="mb-6 rounded-2xl border border-[#E5E6F9] bg-[#f8f9fd] p-4 text-xs text-slate-700 leading-relaxed dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-300">
              <strong className="text-[#175624] dark:text-[#dfb962] block mb-1">
                CA Comparative Regime Analysis:
              </strong>
              {caAudit.taxAudit.regimeAnalysis}
            </div>

            {/* Deductions Progress Bars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              {/* 80C */}
              <div className="rounded-2xl border border-[#E5E6F9] bg-white p-4 dark:border-white/10 dark:bg-white/[0.02]">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Section 80C (PPF/ELSS/EPF)</span>
                  <span className="font-tabular text-[#175624] dark:text-[#34d399]">
                    ₹{caAudit.taxAudit.existingDeductions.section80C.toLocaleString("en-IN")} / ₹1.5L
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#E5E6F9] dark:bg-white/10 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-[#175624] dark:bg-[#34d399]"
                    style={{
                      width: `${(caAudit.taxAudit.existingDeductions.section80C / 150000) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  Untapped: ₹{caAudit.taxAudit.untappedDeductions.section80CRemaining.toLocaleString("en-IN")} remaining
                </span>
              </div>

              {/* 80D */}
              <div className="rounded-2xl border border-[#E5E6F9] bg-white p-4 dark:border-white/10 dark:bg-white/[0.02]">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Section 80D (Health Mediclaim)</span>
                  <span className="font-tabular text-[#A4873E] dark:text-[#dfb962]">
                    ₹{caAudit.taxAudit.existingDeductions.section80D.toLocaleString("en-IN")} / ₹25k
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#E5E6F9] dark:bg-white/10 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-[#A4873E] dark:bg-[#dfb962]"
                    style={{
                      width: `${(caAudit.taxAudit.existingDeductions.section80D / 25000) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  Untapped: ₹{caAudit.taxAudit.untappedDeductions.section80DRemaining.toLocaleString("en-IN")} remaining
                </span>
              </div>

              {/* 80CCD */}
              <div className="rounded-2xl border border-[#E5E6F9] bg-white p-4 dark:border-white/10 dark:bg-white/[0.02]">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Section 80CCD(1B) (NPS Extra)</span>
                  <span className="font-tabular text-slate-800 dark:text-white">
                    ₹{caAudit.taxAudit.existingDeductions.section80CCD.toLocaleString("en-IN")} / ₹50k
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#E5E6F9] dark:bg-white/10 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-[#333333] dark:bg-slate-300"
                    style={{
                      width: `${(caAudit.taxAudit.existingDeductions.section80CCD / 50000) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  Untapped: ₹{caAudit.taxAudit.untappedDeductions.section80CCDRemaining.toLocaleString("en-IN")} remaining
                </span>
              </div>
            </div>

            {/* Actionable Tax Directives */}
            <div className="space-y-2 border-t border-[#E5E6F9] pt-4 dark:border-white/[0.08]">
              <span className="text-xs font-bold text-slate-800 dark:text-white block mb-2">
                CA Tax Optimization Action Items:
              </span>
              {caAudit.taxAudit.actionableTaxTips.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#175624] dark:text-[#34d399] shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* SECTION B: FOIR DEBT AUDIT & EMERGENCY RUNWAY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* FOIR Ratio Gauge */}
            <Card className="lg:col-span-6 p-6 sm:p-7 border-[#E5E6F9] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#11141d]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-[#175624] dark:text-[#dfb962]" />
                  <h3 className="text-base font-bold text-[#175624] dark:text-white">
                    FOIR &amp; Debt Obligation Health
                  </h3>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    caAudit.foirAudit.verdictColor === "emerald"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : caAudit.foirAudit.verdictColor === "amber"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                  }`}
                >
                  {caAudit.foirAudit.status}
                </span>
              </div>

              <div className="my-5 flex items-baseline gap-2">
                <span className="text-5xl font-black font-tabular text-[#333333] dark:text-white">
                  {caAudit.foirAudit.foirPercent}%
                </span>
                <span className="text-xs font-semibold text-slate-400">of Net Inflow</span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {caAudit.foirAudit.recommendation}
              </p>

              <div className="rounded-xl border border-[#E5E6F9] bg-[#f8f9fd] p-3.5 text-xs dark:border-white/10 dark:bg-white/[0.02]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    Safe Additional EMI Capacity:
                  </span>
                  <span className="font-bold text-[#175624] dark:text-[#34d399] font-tabular">
                    ₹{caAudit.foirAudit.maxSafeAdditionalEmi.toLocaleString("en-IN")}/mo
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Calculated against RBI 40% maximum prudent FOIR ceiling.
                </span>
              </div>
            </Card>

            {/* Emergency Reserve & Survival Cushion */}
            <Card className="lg:col-span-6 p-6 sm:p-7 border-[#E5E6F9] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#11141d]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#A4873E] dark:text-[#dfb962]" />
                  <h3 className="text-base font-bold text-[#175624] dark:text-white">
                    Emergency Liquid Buffer
                  </h3>
                </div>
                <span className="rounded-full bg-[#A4873E]/15 px-2.5 py-0.5 text-xs font-bold text-[#A4873E] dark:bg-[#dfb962]/20 dark:text-[#dfb962]">
                  {caAudit.emergencyFund.status}
                </span>
              </div>

              <div className="my-5 flex items-baseline gap-2">
                <span className="text-5xl font-black font-tabular text-[#175624] dark:text-[#dfb962]">
                  ₹{caAudit.emergencyFund.currentEstimatedBuffer.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  / ₹{caAudit.emergencyFund.sixMonthTarget.toLocaleString("en-IN")} Target
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {caAudit.emergencyFund.recommendation}
              </p>

              <div className="h-2 w-full rounded-full bg-[#E5E6F9] dark:bg-white/10 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full bg-[#A4873E] dark:bg-[#dfb962]"
                  style={{ width: `${caAudit.emergencyFund.fundedPercentage}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 block">
                {caAudit.emergencyFund.fundedPercentage}% of recommended 6-Month Essential Expense Buffer funded
              </span>
            </Card>
          </div>

          {/* SECTION C: 5-YEAR ASSET ALLOCATION & COMPOUNDING */}
          <Card className="p-6 sm:p-8 border-[#E5E6F9] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#11141d]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-[#175624] dark:text-[#dfb962]" />
                  <h3 className="text-base font-bold text-[#175624] dark:text-white">
                    Strategic Wealth Horizon &amp; Asset Allocation Plan
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Calculated from your monthly investible surplus (₹{caAudit.assetAllocation.monthlyInvestibleSurplus.toLocaleString("en-IN")}/mo)
                </p>
              </div>

              <div className="rounded-xl bg-[#175624]/10 px-3 py-1.5 text-right dark:bg-[#dfb962]/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  5-Year Projected Corpus (12% CAGR)
                </span>
                <span className="text-base font-black text-[#175624] dark:text-[#dfb962] font-tabular">
                  ₹{(caAudit.assetAllocation.projectedFiveYearCorpus / 100000).toFixed(2)} Lakhs
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {caAudit.assetAllocation.recommendations.map((rec) => (
                <div
                  key={rec.assetClass}
                  className="rounded-2xl border border-[#E5E6F9] bg-[#f8f9fd] p-4 text-xs dark:border-white/10 dark:bg-white/[0.02] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[#175624] dark:text-[#dfb962]">
                        {rec.percentage}%
                      </span>
                      <span className="font-bold text-[#333333] dark:text-white font-tabular">
                        ₹{rec.amount.toLocaleString("en-IN")}/mo
                      </span>
                    </div>
                    <h4 className="font-bold text-[#333333] dark:text-slate-200 mb-1">
                      {rec.assetClass}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                      {rec.rationale}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#E5E6F9] dark:border-white/10 text-[10px] text-slate-400">
                    <span className="font-bold block text-slate-600 dark:text-slate-300">
                      Instrument:
                    </span>
                    {rec.suggestedInstruments}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* SECTION D: INTERACTIVE "CONSULT YOUR PERSONAL AI CA" */}
          <Card className="p-6 sm:p-8 border-[#E5E6F9] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#11141d]">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-[#A4873E] dark:text-[#dfb962]" />
              <h3 className="text-base font-bold text-[#175624] dark:text-white">
                Consult Your Personal AI CA
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Ask any specific question about your taxes, deductions, debt, or financial goals:
            </p>

            {/* Quick Pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                "Mera tax kaise bachega?",
                "Kya mai ₹15,000 ki nayi EMI afford kar sakta hoon?",
                "Mera emergency fund kitna hona chahiye?",
                "Pichle mahine ke sabse bade financial leaks kya the?",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setCaQuery(q);
                    handleAskCA(q);
                  }}
                  className="rounded-full border border-[#E5E6F9] bg-[#f8f9fd] px-3 py-1.5 text-xs font-semibold text-[#333333] hover:border-[#175624] hover:text-[#175624] dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-[#dfb962] dark:hover:text-[#dfb962] transition"
                >
                  💡 {q}
                </button>
              ))}
            </div>

            {/* Input & Ask Button */}
            <div className="flex gap-2 mb-4">
              <Input
                type="text"
                placeholder="Type your question for the CA (e.g. Can I afford to buy a car next year?)..."
                value={caQuery}
                onChange={(e) => setCaQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loadingCa) handleAskCA();
                }}
                className="text-xs"
              />
              <Button
                type="button"
                onClick={() => handleAskCA()}
                disabled={loadingCa || !caQuery.trim()}
                className="gap-1.5 text-xs bg-[#175624] text-white hover:bg-[#12441d] dark:bg-[#dfb962] dark:text-[#080e0a] font-bold shrink-0"
              >
                {loadingCa ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Ask CA</span>
              </Button>
            </div>

            {/* AI CA Response Display */}
            {caAnswer && (
              <div className="rounded-2xl border border-[#175624]/30 bg-[#175624]/5 p-5 text-xs leading-relaxed text-[#333333] dark:border-[#dfb962]/30 dark:bg-[#dfb962]/5 dark:text-slate-200">
                <div className="flex items-center gap-2 font-bold text-[#175624] dark:text-[#dfb962] mb-2">
                  <Landmark className="h-4 w-4" />
                  <span>Chartered Accountant Advisory Response:</span>
                </div>
                <div className="whitespace-pre-line text-xs">{caAnswer}</div>
              </div>
            )}
          </Card>

          {/* SECTION E: OFFICIAL REGULATORY DISCLAIMER */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[11px] text-slate-500 leading-relaxed dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-slate-400 flex items-start gap-3">
            <Lock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <p>
              <strong>Regulatory &amp; Legal Compliance Notice:</strong> FinCoach AI provides algorithmic analytical insights computed from user-provided statements for educational and self-planning purposes. It is not an official statutory audit under the Chartered Accountants Act, 1949 or registered investment advice under SEBI (IA) Regulations, 2013. Always consult a certified professional before executing formal tax filings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
