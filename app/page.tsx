"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  TrendingUp,
  ArrowRight,
  BrainCircuit,
  MessageSquare,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";

const ROTATING_PHRASES = [
  "grounded in real data.",
  "automated with AI precision.",
  "free from hidden leaks.",
  "tailored to your net worth.",
  "queryable in plain English.",
];

function TypewriterHeadline() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState(ROTATING_PHRASES[0]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = ROTATING_PHRASES[phraseIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting) {
      if (displayText.length < currentPhrase.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1));
        }, 75);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 2400);
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length - 1));
        }, 36);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % ROTATING_PHRASES.length);
        }, 420);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, phraseIndex]);

  return (
    <span className="relative inline-flex items-baseline min-h-[1.18em] text-[#A4873E] dark:text-[#dfb962]">
      <span>{displayText}</span>
      <span
        aria-hidden="true"
        className="inline-block w-[3px] sm:w-[4px] md:w-[5px] h-[0.84em] ml-1.5 translate-y-[1px] bg-[#A4873E] dark:bg-[#dfb962] rounded-full animate-cursor"
      />
    </span>
  );
}

export default function Home() {
  const [mockupTab, setMockupTab] = useState<"overview" | "alerts" | "advisor">("overview");

  return (
    <main className="relative min-h-screen flex flex-col bg-[#f8f9fd] text-[#333333] transition-colors duration-200 dark:bg-[#080e0a] dark:text-[#f5f7fa] overflow-x-hidden">
      {/* Background Architectural Grid Pattern with Lavender Frost tone */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d6d9f2_1px,transparent_1px)] [background-size:24px_24px] opacity-60 dark:bg-[radial-gradient(rgba(223,185,98,0.08)_1px,transparent_1px)]" />

      {/* Hero Ambient Radial Glow (Gold + Forest Pine fusion) */}
      <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 h-[380px] w-[500px] sm:w-[820px] -z-10 rounded-full bg-gradient-to-r from-[#175624]/10 via-[#A4873E]/15 to-[#E5E6F9]/30 dark:from-[#34d399]/10 dark:via-[#dfb962]/15 dark:to-transparent blur-3xl animate-pulse-ring" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E5E6F9] bg-white/85 backdrop-blur-md transition-colors dark:border-white/[0.08] dark:bg-[#080e0a]/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#175624] text-[#A4873E] shadow-xs transition-transform duration-300 group-hover:scale-105 dark:bg-[#dfb962] dark:text-[#080e0a]">
              <TrendingUp className="h-4 w-4 stroke-[2.5]" />
            </div>
            <span className="font-bold text-base tracking-tight text-[#175624] dark:text-white">
              FinCoach <span className="text-[#A4873E] dark:text-[#dfb962]">AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-xs font-semibold text-[#333333] dark:text-[#9ca3af] md:flex">
            <button
              onClick={() =>
                document.getElementById("workflow")?.scrollIntoView({ behavior: "smooth" })
              }
              className="transition-colors hover:text-[#175624] dark:hover:text-white"
            >
              Workflow
            </button>
            <button
              onClick={() =>
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
              }
              className="transition-colors hover:text-[#175624] dark:hover:text-white"
            >
              Capabilities
            </button>
            <button
              onClick={() =>
                document.getElementById("security")?.scrollIntoView({ behavior: "smooth" })
              }
              className="transition-colors hover:text-[#175624] dark:hover:text-white"
            >
              Security
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#333333] transition-colors hover:bg-[#E5E6F9]/60 hover:text-[#175624] dark:text-[#E5E6F9] dark:hover:bg-white/[0.06] dark:hover:text-white"
            >
              Sign In
            </Link>
            <Link href="/signup">
              <Button
                size="sm"
                className="group relative overflow-hidden bg-[#175624] text-[#E5E6F9] font-semibold transition-all duration-200 hover:bg-[#12441d] hover:shadow-xs dark:bg-[#dfb962] dark:text-[#080e0a] dark:hover:bg-[#eac36e]"
              >
                <span>Get Started</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-4 pt-16 pb-20 text-center sm:pt-24 sm:pb-28">
        {/* Subtle Release Badge */}
        <div
          className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-[#E5E6F9] bg-white px-3.5 py-1 text-xs font-medium text-[#175624] shadow-2xs transition-all duration-200 hover:border-[#A4873E]/40 hover:shadow-xs dark:border-[#dfb962]/20 dark:bg-[#111a13] dark:text-[#dfb962]"
          style={{ animationDelay: "100ms" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A4873E] opacity-75 dark:bg-[#dfb962]" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A4873E] dark:bg-[#dfb962]" />
          </span>
          <span>FinCoach 2.0 with Merchant Memory</span>
          <ArrowRight className="h-3 w-3 text-[#A4873E] dark:text-[#dfb962]" />
        </div>

        {/* Main Headline with Live Typewriter Letters Animation */}
        <h1
          className="animate-fade-in-up mt-8 text-4xl font-extrabold tracking-tight text-[#175624] sm:text-6xl md:text-7xl dark:text-[#f5f7fa] leading-[1.08]"
          style={{ animationDelay: "200ms" }}
        >
          Personal finance,
          <br />
          <TypewriterHeadline />
        </h1>

        {/* Subtitle */}
        <p
          className="animate-fade-in-up mt-6 max-w-2xl text-base text-[#333333]/85 sm:text-lg dark:text-[#9ca3af] leading-relaxed"
          style={{ animationDelay: "300ms" }}
        >
          Drop in your bank statement. FinCoach categorizes transactions,
          surfaces budget variance alerts, detects recurring merchant charges, and lets you query your own finances in plain English.
        </p>

        {/* CTA Buttons */}
        <div
          className="animate-fade-in-up mt-8 flex flex-wrap items-center justify-center gap-3.5"
          style={{ animationDelay: "400ms" }}
        >
          <Link href="/signup">
            <Button
              size="lg"
              className="group relative overflow-hidden h-11 px-6 text-sm font-semibold bg-[#175624] text-[#E5E6F9] shadow-sm transition-all duration-300 hover:bg-[#12441d] hover:shadow-md hover:shadow-[#175624]/20 hover:-translate-y-0.5 active:translate-y-0 dark:bg-[#dfb962] dark:text-[#080e0a] dark:hover:bg-[#eac36e] dark:shadow-[#dfb962]/20"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
              <span className="relative z-10 flex items-center">
                Start Free Today
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            onClick={() =>
              document.getElementById("workflow")?.scrollIntoView({ behavior: "smooth" })
            }
            className="h-11 px-6 text-sm font-medium border-[#E5E6F9] bg-white text-[#333333] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E5E6F9]/50 hover:text-[#175624] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#f5f7fa] dark:hover:bg-white/[0.08]"
          >
            See How It Works
          </Button>
        </div>

        {/* Proof Checkmarks */}
        <div
          className="animate-fade-in-up mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-[#333333] dark:text-[#9ca3af] font-medium"
          style={{ animationDelay: "500ms" }}
        >
          <div className="flex items-center gap-1.5 transition-transform duration-200 hover:scale-105">
            <CheckCircle2 className="h-4 w-4 text-[#175624] dark:text-[#34d399]" />
            <span>Zero manual spreadsheet upkeep</span>
          </div>
          <div className="flex items-center gap-1.5 transition-transform duration-200 hover:scale-105">
            <CheckCircle2 className="h-4 w-4 text-[#A4873E] dark:text-[#dfb962]" />
            <span>Adaptive merchant memory</span>
          </div>
          <div className="flex items-center gap-1.5 transition-transform duration-200 hover:scale-105">
            <CheckCircle2 className="h-4 w-4 text-[#175624] dark:text-[#34d399]" />
            <span>PostgreSQL Row-Level Security</span>
          </div>
        </div>

        {/* Interactive & Animated Product Preview Mockup */}
        <div
          className="animate-fade-in-up mt-14 w-full rounded-2xl border border-[#E5E6F9] bg-white p-4 sm:p-6 shadow-xl text-left transition-all duration-300 hover:shadow-2xl dark:border-white/[0.08] dark:bg-[#111a13]"
          style={{ animationDelay: "600ms" }}
        >
          {/* Mockup Header bar with Interactive Tab Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E6F9] pb-3 mb-5 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#A4873E] dark:bg-[#dfb962]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#175624] dark:bg-[#34d399]" />
              <span className="ml-2 font-mono text-[11px] text-[#A4873E] dark:text-[#9ca3af]">
                fincoach.ai/dashboard
              </span>
            </div>

            {/* Interactive Preview Tabs */}
            <div className="flex items-center gap-1 rounded-lg border border-[#E5E6F9] bg-[#E5E6F9]/40 p-0.5 text-[11px] font-medium text-[#333333] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-400">
              <button
                type="button"
                onClick={() => setMockupTab("overview")}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  mockupTab === "overview"
                    ? "bg-white text-[#175624] shadow-2xs font-bold dark:bg-[#17241b] dark:text-[#dfb962]"
                    : "hover:text-[#175624] dark:hover:text-white"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setMockupTab("alerts")}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  mockupTab === "alerts"
                    ? "bg-white text-[#175624] shadow-2xs font-bold dark:bg-[#17241b] dark:text-[#dfb962]"
                    : "hover:text-[#175624] dark:hover:text-white"
                }`}
              >
                Variance Alerts
              </button>
              <button
                type="button"
                onClick={() => setMockupTab("advisor")}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  mockupTab === "advisor"
                    ? "bg-white text-[#175624] shadow-2xs font-bold dark:bg-[#17241b] dark:text-[#dfb962]"
                    : "hover:text-[#175624] dark:hover:text-white"
                }`}
              >
                AI Synthesis
              </button>
            </div>

            {/* Radar Pulse Badge */}
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E5E6F9] border border-[#d0d3f2] px-2.5 py-0.5 text-[11px] font-bold text-[#175624] dark:bg-[#17241b] dark:border-[#34d399]/30 dark:text-[#34d399]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#175624] opacity-75 dark:bg-[#34d399]" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#175624] dark:bg-[#34d399]" />
              </span>
              Active Sync
            </span>
          </div>

          {/* Dynamic Content based on Mockup Tab */}
          {mockupTab === "overview" && (
            <div className="space-y-4 transition-all duration-300">
              {/* Metric cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="group rounded-xl border border-[#E5E6F9] bg-[#E5E6F9]/30 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#A4873E]/40 hover:shadow-xs dark:border-white/[0.04] dark:bg-white/[0.02] dark:hover:border-white/[0.12]">
                  <span className="text-xs text-[#333333]/70 dark:text-slate-400">Monthly Spending</span>
                  <p className="mt-1 text-2xl font-bold text-[#175624] dark:text-white font-tabular">
                    ₹32,450
                  </p>
                  <span className="text-[11px] font-semibold text-[#175624] dark:text-[#34d399]">
                    ↓ 14% vs last cycle
                  </span>
                </div>
                <div className="group rounded-xl border border-[#E5E6F9] bg-[#E5E6F9]/30 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#A4873E]/40 hover:shadow-xs dark:border-white/[0.04] dark:bg-white/[0.02] dark:hover:border-white/[0.12]">
                  <span className="text-xs text-[#333333]/70 dark:text-slate-400">Total Inflow</span>
                  <p className="mt-1 text-2xl font-bold text-[#A4873E] dark:text-[#dfb962] font-tabular">
                    ₹85,000
                  </p>
                  <span className="text-[11px] text-[#666666] dark:text-slate-400">Direct deposit</span>
                </div>
                <div className="group rounded-xl border border-[#E5E6F9] bg-[#E5E6F9]/30 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#A4873E]/40 hover:shadow-xs dark:border-white/[0.04] dark:bg-white/[0.02] dark:hover:border-white/[0.12]">
                  <span className="text-xs text-[#333333]/70 dark:text-slate-400">Primary Expense</span>
                  <p className="mt-1 text-2xl font-bold text-[#333333] dark:text-white font-tabular">
                    Food & Dining
                  </p>
                  <span className="text-[11px] text-[#A4873E] dark:text-[#dfb962]">₹12,800 allocated</span>
                </div>
              </div>

              {/* Sample Live Transaction Row */}
              <div className="rounded-xl border border-[#E5E6F9] bg-white p-3 text-xs dark:border-white/[0.04] dark:bg-white/[0.02]">
                <div className="flex items-center justify-between font-mono text-[11px] text-[#A4873E] dark:text-slate-400 mb-2">
                  <span>RECENT SETTLED TRANSACTIONS</span>
                  <span>MERCHANT MEMORY CONFIRMED</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#f8f9fd] border border-[#E5E6F9] transition-colors hover:border-[#A4873E]/50 dark:bg-white/[0.03] dark:border-white/[0.04]">
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-md bg-[#175624] text-[#A4873E] flex items-center justify-center font-bold text-[10px] dark:bg-[#dfb962] dark:text-[#080e0a]">
                        SW
                      </div>
                      <div>
                        <span className="font-semibold text-[#333333] dark:text-slate-100">Swiggy Delivery</span>
                        <span className="ml-2 text-[10px] text-[#A4873E] dark:text-slate-400">Auto-tagged Food & Dining</span>
                      </div>
                    </div>
                    <span className="font-tabular font-bold text-rose-600 dark:text-rose-400">-₹450.00</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mockupTab === "alerts" && (
            <div className="space-y-3 transition-all duration-300">
              <div className="rounded-xl border border-[#A4873E]/40 bg-[#f5eedf]/60 p-4 text-xs dark:border-[#dfb962]/30 dark:bg-[#dfb962]/[0.08]">
                <div className="flex items-center gap-2 mb-1.5 font-bold text-[#175624] dark:text-[#dfb962]">
                  <AlertTriangle className="h-4 w-4 text-[#A4873E] dark:text-[#dfb962]" />
                  <span>Velocity Alert: Food & Dining at 85% of Monthly Limit</span>
                </div>
                <p className="text-[#333333] leading-relaxed dark:text-slate-300">
                  You have spent ₹12,800 of your ₹15,000 limit with 12 days remaining in this billing cycle. Current daily run-rate is projected to exceed allowance by ₹2,400.
                </p>
              </div>
              <div className="rounded-xl border border-[#175624]/20 bg-[#e8f5ea] p-4 text-xs dark:border-[#34d399]/30 dark:bg-[#34d399]/[0.08]">
                <div className="flex items-center gap-2 mb-1.5 font-bold text-[#175624] dark:text-[#34d399]">
                  <CheckCircle2 className="h-4 w-4 text-[#175624] dark:text-[#34d399]" />
                  <span>Subscription Audit: 0 Unrecognized Recurring Charges</span>
                </div>
                <p className="text-[#333333] leading-relaxed dark:text-slate-300">
                  Verified 3 recurring services (AWS, Netflix, Spotify). Monthly subscription run-rate remains constant at ₹1,849.
                </p>
              </div>
            </div>
          )}

          {mockupTab === "advisor" && (
            <div className="rounded-xl border border-[#E5E6F9] bg-[#E5E6F9]/30 p-4 text-xs dark:border-white/[0.06] dark:bg-white/[0.02] transition-all duration-300">
              <div className="flex items-center gap-2 mb-2 font-bold text-[#175624] dark:text-[#dfb962]">
                <Sparkles className="h-3.5 w-3.5 text-[#A4873E] dark:text-[#dfb962]" />
                <span>Executive Financial Synthesis</span>
              </div>
              <p className="text-[#333333] leading-relaxed dark:text-slate-300">
                Net cash flow remained positive with a surplus of ₹52,550. Discretionary spending was reduced by 14% compared to the prior period. Rebalancing ₹15,000 into short-term liquid reserves will fulfill your emergency fund target 18 days ahead of schedule.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* WORKFLOW SECTION */}
      <section id="workflow" className="w-full border-t border-[#E5E6F9] bg-white py-20 px-4 transition-colors dark:border-white/[0.06] dark:bg-[#0c120e]">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A4873E] dark:text-[#dfb962]">
              Pipeline
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#175624] dark:text-white">
              From raw statement to structured wealth insight
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Import Any Format",
                desc: "Drop in standard PDF, Excel (.xlsx/.xls), or CSV exports from any retail or commercial bank with automatic conversion.",
                icon: FileSpreadsheet,
              },
              {
                step: "02",
                title: "Adaptive Classification",
                desc: "Transactions are categorized via Gemini AI and our intelligent heuristic engine with permanent Merchant Memory.",
                icon: BrainCircuit,
              },
              {
                step: "03",
                title: "Query & Synthesize",
                desc: "Inspect spending velocity, set budget thresholds, and ask plain-English questions grounded in your transaction log.",
                icon: MessageSquare,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="group rounded-2xl border border-[#E5E6F9] bg-[#f8f9fd] p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#A4873E]/50 hover:shadow-md dark:border-white/[0.06] dark:bg-[#111a13] dark:hover:border-[#dfb962]/40"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E5E6F9] text-[#175624] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#175624] group-hover:text-[#E5E6F9] dark:bg-white/[0.08] dark:text-[#dfb962] dark:group-hover:bg-[#dfb962] dark:group-hover:text-[#080e0a]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs font-bold text-[#A4873E] dark:text-[#dfb962] transition-colors">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#175624] dark:text-white mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#333333]/85 leading-relaxed dark:text-slate-400">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section id="features" className="w-full border-t border-[#E5E6F9] py-20 px-4 transition-colors dark:border-white/[0.06]">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A4873E] dark:text-[#dfb962]">
              Capabilities
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#175624] dark:text-white">
              Built for precision and daily utility
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: "Universal Statement Parser",
                desc: "Natively converts PDF, Excel spreadsheets, and irregular CSV exports into standardized clean ledger records.",
                icon: FileSpreadsheet,
              },
              {
                title: "Merchant Memory Engine",
                desc: "When you assign a transaction to a new category, FinCoach permanently learns that merchant for all subsequent uploads.",
                icon: BrainCircuit,
              },
              {
                title: "Natural-Language AI Advisor",
                desc: "Ask specific queries like 'What did I spend on dining out last weekend?' and get verified answers from your data.",
                icon: MessageSquare,
              },
              {
                title: "Subscription Cadence Audit",
                desc: "Automatically isolates recurring charges by tracking merchant frequency and calculating average run rates.",
                icon: Layers,
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-[#E5E6F9] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#A4873E]/50 hover:shadow-md dark:border-white/[0.06] dark:bg-[#111a13] dark:hover:border-[#dfb962]/40"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#E5E6F9] text-[#175624] transition-transform duration-300 group-hover:scale-110 dark:bg-[#17241b] dark:text-[#dfb962]">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-sm font-bold text-[#175624] dark:text-white mb-1.5 flex items-center justify-between">
                    <span>{f.title}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#A4873E] opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-[#dfb962]" />
                  </h3>
                  <p className="text-xs text-[#333333]/85 leading-relaxed dark:text-slate-400">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECURITY CALLOUT */}
      <section id="security" className="w-full border-t border-[#E5E6F9] bg-white py-16 px-4 transition-colors dark:border-white/[0.06] dark:bg-[#0c120e]">
        <div className="group mx-auto max-w-4xl rounded-2xl border border-[#E5E6F9] bg-[#f8f9fd] p-6 sm:p-8 text-center transition-all duration-300 hover:border-[#A4873E]/50 hover:shadow-md dark:border-white/[0.08] dark:bg-[#111a13] dark:hover:border-[#dfb962]/30">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#175624] text-[#A4873E] transition-transform duration-300 group-hover:scale-110 dark:bg-[#dfb962] dark:text-[#080e0a]">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-[#175624] dark:text-white">
            Row-Level Data Isolation
          </h3>
          <p className="mt-2 max-w-md mx-auto text-xs text-[#333333]/85 leading-relaxed dark:text-slate-400">
            Transactions are stored in PostgreSQL with strict Row-Level Security policies. Only your authenticated session can access your financial ledger.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-[#E5E6F9] py-8 px-4 text-center text-xs text-[#333333]/70 dark:border-white/[0.06] dark:text-slate-500">
        <p>© {new Date().getFullYear()} FinCoach AI. Engineered for personal wealth clarity.</p>
      </footer>
    </main>
  );
}
