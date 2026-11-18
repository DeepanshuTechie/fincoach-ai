"use client";

import { useState, useMemo } from "react";
import {
  calculateFinScore,
  simulateAffordability,
  FinScoreResult,
  AffordabilitySimulation,
  CoachActionPlan,
} from "@/lib/coach-engine";
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
  // 1. Core Financial Score Engine
  const finScore: FinScoreResult = useMemo(
    () => calculateFinScore(transactions),
    [transactions]
  );

  // 2. Affordability What-If Simulator State
  const [itemName, setItemName] = useState("iPhone 16");
  const [itemCost, setItemCost] = useState(79900);
  const [isEmi, setIsEmi] = useState(true);
  const [emiMonths, setEmiMonths] = useState(6);

  // Current balance approximation from income vs expense
  const estimatedBalance = useMemo(() => {
    return Math.max(
      35000,
      finScore.metrics.monthlyIncome - finScore.metrics.monthlyExpense + 25000
    );
  }, [finScore]);

  // Real-time Affordability Simulation
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

  // 3. AI Persona State
  const [persona, setPersona] = useState<"shark" | "buffett" | "zen">("shark");
  const [plan, setPlan] = useState<CoachActionPlan>(initialPlan);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [completedMissions, setCompletedMissions] = useState<Record<number, boolean>>({});

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

  return (
    <div className="space-y-8 pb-12">
      {/* =========================================================================
          SECTION 1: AI FINANCIAL HEALTH SCORE (FINSCORE 0-1000)
         ========================================================================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main FinScore Dial & Grade */}
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
              {/* Pillar 1: Savings */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-200">
                    1. Savings Rate Ratio (Target &gt; 20%)
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

              {/* Pillar 2: 50/30/20 Rule */}
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

              {/* Pillar 3: Discretionary Impulse */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-200">
                    3. Impulse & Dining Discipline
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

              {/* Pillar 4: Subscriptions */}
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

              {/* Pillar 5: Emergency Cushion */}
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

      {/* =========================================================================
          SECTION 2: "CAN I AFFORD THIS?" WHAT-IF SCENARIO SIMULATOR
         ========================================================================= */}
      <Card className="p-6 sm:p-8 border-[#E5E6F9] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#11141d]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#175624] text-white dark:bg-[#dfb962] dark:text-[#080e0a]">
                <Compass className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold text-[#175624] dark:text-white">
                "Can I Afford This?" — What-If Decision Engine
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
          {/* Item Name */}
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

          {/* Amount */}
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

          {/* Payment Type */}
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
                    ? "bg-[#175624] text-white shadow-xs dark:bg-[#dfb962] dark:text-[#080e0a]"
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
                    ? "bg-[#175624] text-white shadow-xs dark:bg-[#dfb962] dark:text-[#080e0a]"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Monthly EMI
              </button>
            </div>
          </div>

          {/* EMI Tenure */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                EMI Tenure
              </Label>
              <span className="text-xs font-bold text-[#175624] dark:text-[#dfb962]">
                {isEmi ? `${emiMonths} Months` : "N/A (Full)"}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              {[3, 6, 9, 12, 18].map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={!isEmi}
                  onClick={() => setEmiMonths(m)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                    !isEmi
                      ? "opacity-30 cursor-not-allowed"
                      : emiMonths === m
                      ? "bg-[#175624] text-white dark:bg-[#dfb962] dark:text-[#080e0a]"
                      : "border border-[#E5E6F9] bg-white text-slate-700 hover:border-[#175624] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Verdict Banner */}
        <div
          className={`mb-6 rounded-2xl border p-5 ${
            simulation.verdict === "safe"
              ? "border-[#175624]/40 bg-[#175624]/10 text-[#175624] dark:border-[#34d399]/30 dark:bg-[#34d399]/10 dark:text-[#34d399]"
              : simulation.verdict === "caution"
              ? "border-[#A4873E]/40 bg-[#A4873E]/10 text-[#333333] dark:border-[#dfb962]/30 dark:bg-[#dfb962]/10 dark:text-[#dfb962]"
              : "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-300"
          }`}
        >
          <div className="flex items-start gap-3.5">
            {simulation.verdict === "safe" ? (
              <ShieldCheck className="h-6 w-6 shrink-0 text-[#175624] dark:text-[#34d399] mt-0.5" />
            ) : simulation.verdict === "caution" ? (
              <AlertTriangle className="h-6 w-6 shrink-0 text-[#A4873E] dark:text-[#dfb962] mt-0.5" />
            ) : (
              <ShieldAlert className="h-6 w-6 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            )}
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                {simulation.headline}
              </h3>
              <p className="text-xs font-normal mt-1 leading-relaxed opacity-90">
                {simulation.explanation}
              </p>
              <div className="mt-3 rounded-xl bg-white/80 p-3 text-xs font-semibold dark:bg-black/30">
                {simulation.coachAdvice}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive 6-Month Projection AreaChart */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                6-Month Balance Trajectory Simulation
              </h4>
              <p className="text-[11px] text-slate-400">
                Green: Normal Savings Cadence · Gold/Purple: Balance With "{itemName}"
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
                  name="Baseline"
                />
                <Area
                  type="monotone"
                  dataKey="projectedBalance"
                  stroke="#A4873E"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#projectedGradient)"
                  name="With Purchase"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4 Impact Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-[#E5E6F9] bg-[#f8f9fd] p-3 text-center dark:border-white/[0.08] dark:bg-white/[0.03]">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Monthly EMI Commitment
            </span>
            <span className="text-base font-extrabold text-[#175624] dark:text-[#dfb962] font-tabular">
              {isEmi
                ? `₹${simulation.monthlyEmiAmount.toLocaleString("en-IN")}`
                : "₹0 (Upfront)"}
            </span>
          </div>

          <div className="rounded-xl border border-[#E5E6F9] bg-[#f8f9fd] p-3 text-center dark:border-white/[0.08] dark:bg-white/[0.03]">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Savings Surplus Reduction
            </span>
            <span
              className={`text-base font-extrabold font-tabular ${
                simulation.impactMetrics.savingsReductionPercent > 50
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-[#333333] dark:text-white"
              }`}
            >
              -{simulation.impactMetrics.savingsReductionPercent}%
            </span>
          </div>

          <div className="rounded-xl border border-[#E5E6F9] bg-[#f8f9fd] p-3 text-center dark:border-white/[0.08] dark:bg-white/[0.03]">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Lowest Projected Cash Floor
            </span>
            <span className="text-base font-extrabold text-[#333333] dark:text-white font-tabular">
              ₹{simulation.impactMetrics.minimumProjectedBalance.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="rounded-xl border border-[#E5E6F9] bg-[#f8f9fd] p-3 text-center dark:border-white/[0.08] dark:bg-white/[0.03]">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Adjusted Cash Runway
            </span>
            <span className="text-base font-extrabold text-[#175624] dark:text-[#34d399] font-tabular">
              {simulation.impactMetrics.projectedRunwayDays} Days
            </span>
          </div>
        </div>
      </Card>

      {/* =========================================================================
          SECTION 3: AI COACH PERSONA & ACTIVE WEEKLY DRILLS
         ========================================================================= */}
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
              <span>🦈 Tough Love</span>
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
              <span>📈 Wealth Builder</span>
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
              <span>🧘 Zen Guide</span>
            </button>
          </div>
        </div>

        {/* Coach Voice Banner */}
        <div className="mb-6 rounded-2xl border border-[#A4873E]/30 bg-[#A4873E]/10 p-4 text-xs font-semibold text-[#333333] dark:border-[#dfb962]/30 dark:bg-[#dfb962]/10 dark:text-[#dfb962] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {loadingPlan ? (
              <Loader2 className="h-5 w-5 animate-spin shrink-0 text-[#A4873E] dark:text-[#dfb962]" />
            ) : (
              <Flame className="h-5 w-5 shrink-0 text-[#A4873E] dark:text-[#dfb962]" />
            )}
            <p className="text-xs sm:text-sm font-bold">
              {loadingPlan
                ? "Synthesizing tactical weekly missions with Gemini 3..."
                : plan.headline}
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400 shrink-0 hidden sm:inline-block">
            Gemini 3 Pro-Coach
          </span>
        </div>

        {/* 3 Weekly Mission Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {plan.weeklyMissions.map((m, idx) => {
            const isDone = !!completedMissions[idx];
            return (
              <div
                key={idx}
                onClick={() => toggleMission(idx)}
                className={`cursor-pointer rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between ${
                  isDone
                    ? "border-[#175624] bg-[#175624]/5 dark:border-[#34d399]/40 dark:bg-[#34d399]/5"
                    : "border-[#E5E6F9] bg-[#f8f9fd] hover:border-[#A4873E]/60 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-[#dfb962]/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded-full bg-[#E5E6F9] px-2 py-0.5 text-[10px] font-bold text-[#175624] dark:bg-white/10 dark:text-[#dfb962]">
                      {m.category}
                    </span>
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center border ${
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
  );
}
