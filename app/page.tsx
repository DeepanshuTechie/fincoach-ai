"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card3D } from "@/components/ui/card-3d";
import { WealthCard3D } from "@/components/ui/card-3d-wealth";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { OrnamentalDivider } from "@/components/ui/ornamental-divider";
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
  ShieldCheck,
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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 15);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="relative min-h-screen flex flex-col bg-[#f8f9fd] text-[#333333] transition-colors duration-200 dark:bg-[#080e0a] dark:text-[#f5f7fa] overflow-x-clip">
      {/* Background Architectural Grid Pattern with Lavender Frost tone */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d6d9f2_1px,transparent_1px)] [background-size:24px_24px] opacity-60 dark:bg-[radial-gradient(rgba(223,185,98,0.08)_1px,transparent_1px)]" />

      {/* Hero Ambient Radial Glow (Gold + Forest Pine fusion) */}
      <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 h-[380px] w-[500px] sm:w-[820px] -z-10 rounded-full bg-gradient-to-r from-[#175624]/10 via-[#A4873E]/15 to-[#E5E6F9]/30 dark:from-[#34d399]/10 dark:via-[#dfb962]/15 dark:to-transparent blur-3xl animate-pulse-ring" />

      {/* High-Performance Sticky Glassmorphic Navbar */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? "border-b border-[#E5E6F9]/80 bg-white/80 shadow-[0_4px_25px_-4px_rgba(23,86,36,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#080e0a]/80 dark:shadow-[0_4px_25px_-4px_rgba(0,0,0,0.6)]"
            : "border-b border-transparent bg-white/40 backdrop-blur-md dark:bg-transparent"
        }`}
      >
        <div
          className={`mx-auto flex max-w-6xl items-center justify-between px-4 transition-all duration-300 sm:px-6 ${
            isScrolled ? "h-14" : "h-16"
          }`}
        >
          {/* Brand Logo with 3D micro-glow */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#175624] to-[#0c3114] text-[#dfb962] shadow-xs ring-1 ring-[#175624]/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md dark:from-[#dfb962] dark:to-[#b8953d] dark:text-[#080e0a]">
              <TrendingUp className="h-4.5 w-4.5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-[#175624] dark:text-white leading-none">
                FinCoach <span className="text-[#A4873E] dark:text-[#dfb962]">AI</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest font-bold text-[#A4873E] dark:text-[#dfb962]/80 mt-0.5">
                Autonomous Wealth OS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1 text-xs font-semibold text-[#333333] dark:text-[#9ca3af] md:flex">
            <button
              onClick={() =>
                document.getElementById("workflow")?.scrollIntoView({ behavior: "smooth" })
              }
              className="rounded-full px-3.5 py-1.5 transition-all hover:bg-[#E5E6F9]/60 hover:text-[#175624] dark:hover:bg-white/[0.06] dark:hover:text-white cursor-pointer"
            >
              Workflow
            </button>
            <button
              onClick={() =>
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
              }
              className="rounded-full px-3.5 py-1.5 transition-all hover:bg-[#E5E6F9]/60 hover:text-[#175624] dark:hover:bg-white/[0.06] dark:hover:text-white cursor-pointer"
            >
              Capabilities
            </button>
            <button
              onClick={() =>
                document.getElementById("security")?.scrollIntoView({ behavior: "smooth" })
              }
              className="rounded-full px-3.5 py-1.5 transition-all hover:bg-[#E5E6F9]/60 hover:text-[#175624] dark:hover:bg-white/[0.06] dark:hover:text-white cursor-pointer"
            >
              Security
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-xl border border-[#E5E6F9] bg-white/70 px-3.5 py-1.5 text-xs font-bold text-[#333333] transition-all hover:border-[#A4873E]/50 hover:bg-white hover:text-[#175624] hover:shadow-2xs dark:border-white/10 dark:bg-white/[0.04] dark:text-[#E5E6F9] dark:hover:bg-white/[0.08] dark:hover:text-white"
            >
              Sign In
            </Link>
            <Link href="/signup">
              <Button
                size="sm"
                className="group relative overflow-hidden rounded-xl bg-[#175624] px-4 text-[#E5E6F9] font-bold shadow-xs transition-all duration-200 hover:bg-[#12441d] hover:shadow-md hover:scale-[1.02] dark:bg-[#dfb962] dark:text-[#080e0a] dark:hover:bg-[#eac36e] cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-4 pt-16 pb-20 text-center sm:pt-24 sm:pb-28">
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
        <div className="animate-fade-in-up relative mt-14 w-full" style={{ animationDelay: "500ms" }}>
          {/* Subtle Ambient 3D Depth Glow (behind the card, never covering content) */}
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-[#175624]/15 via-[#A4873E]/10 to-[#175624]/15 blur-2xl transform scale-95 pointer-events-none" />

            <Card3D maxTilt={4} glareEffect={true}>
              <div
                className="w-full rounded-2xl border border-[#E5E6F9] bg-white p-4 sm:p-6 shadow-xl text-left transition-all duration-300 dark:border-white/[0.08] dark:bg-[#111a13]"
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
                      className={`rounded-md px-2.5 py-1 transition-all ${mockupTab === "overview"
                        ? "bg-white text-[#175624] shadow-2xs font-bold dark:bg-[#17241b] dark:text-[#dfb962]"
                        : "hover:text-[#175624] dark:hover:text-white"
                        }`}
                    >
                      Overview
                    </button>
                    <button
                      type="button"
                      onClick={() => setMockupTab("alerts")}
                      className={`rounded-md px-2.5 py-1 transition-all ${mockupTab === "alerts"
                        ? "bg-white text-[#175624] shadow-2xs font-bold dark:bg-[#17241b] dark:text-[#dfb962]"
                        : "hover:text-[#175624] dark:hover:text-white"
                        }`}
                    >
                      Variance Alerts
                    </button>
                    <button
                      type="button"
                      onClick={() => setMockupTab("advisor")}
                      className={`rounded-md px-2.5 py-1 transition-all ${mockupTab === "advisor"
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
            </Card3D>
        </div>
      </section>

      {/* WORKFLOW PIPELINE SECTION WITH FINANCIAL DOODLE PATTERN */}
      <section
        id="workflow"
        className="relative w-full bg-[#f8f9fd] py-24 px-4 overflow-hidden transition-colors dark:bg-[#09110b]"
      >
        {/* Financial Icons Doodle Pattern (Exact match to user's uploaded illustration) */}
        <div
          className="pointer-events-none absolute inset-0 opacity-25 dark:opacity-12 dark:invert transition-opacity duration-300"
          style={{
            backgroundImage: "url('/finance-doodle-pattern.jpg')",
            backgroundRepeat: "repeat",
            backgroundSize: "440px auto",
          }}
        />

        {/* Smooth Vignette Gradient Mask to softly blend edges */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f8f9fd] via-transparent to-[#f8f9fd] dark:from-[#09110b] dark:via-transparent dark:to-[#09110b] opacity-75" />

        <div className="relative mx-auto max-w-5xl">
          {/* Section Header */}
          <ScrollReveal direction="up" distance={30} blur>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#175624]/20 bg-[#175624]/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#175624] dark:border-[#dfb962]/30 dark:bg-[#dfb962]/10 dark:text-[#dfb962]">
                <Sparkles className="h-3 w-3" />
                <span>Automated Pipeline</span>
              </span>
              <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight text-[#175624] dark:text-white">
                From raw statement to structured wealth insight
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto font-medium">
                Three seamless stages powered by AI Merchant Memory and statutory Indian tax intelligence
              </p>
            </div>
          </ScrollReveal>

          {/* Cards with Connecting Process Line */}
          <div className="relative">
            {/* Subtle connecting connector track on desktop */}
            <div className="hidden sm:block absolute top-1/2 left-8 right-8 h-0.5 -translate-y-6 border-t-2 border-dashed border-[#175624]/20 dark:border-white/10 -z-0" />

            <StaggerContainer
              staggerDelay={0.16}
              className="relative grid grid-cols-1 gap-6 sm:grid-cols-3 z-10"
            >
              {[
                {
                  step: "01",
                  title: "Import Any Format",
                  desc: "Drop in standard PDF, Excel (.xlsx/.xls), or CSV exports from any retail or commercial bank with automatic conversion.",
                  icon: FileSpreadsheet,
                  badge: "Universal Parser",
                },
                {
                  step: "02",
                  title: "Adaptive Classification",
                  desc: "Transactions are categorized via Gemini AI and our intelligent heuristic engine with permanent Merchant Memory.",
                  icon: BrainCircuit,
                  badge: "Merchant Memory",
                },
                {
                  step: "03",
                  title: "Query & Synthesize",
                  desc: "Inspect spending velocity, set budget thresholds, and ask plain-English questions grounded in your transaction log.",
                  icon: MessageSquare,
                  badge: "Autonomous CA",
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <StaggerItem
                    key={item.step}
                    index={idx}
                    direction="up"
                    distance={36}
                    blur
                    scale
                    className="h-full"
                  >
                    <div className="group relative h-full rounded-3xl border border-[#E5E6F9] bg-white/95 p-7 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-[#175624]/50 hover:shadow-xl dark:border-white/[0.08] dark:bg-[#111a13]/95 dark:hover:border-[#dfb962]/40 overflow-hidden">
                      {/* Subtle Top Gradient Accent Line */}
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#175624] via-[#A4873E] to-[#175624] opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

                      <div className="flex items-center justify-between mb-5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#175624]/10 to-[#175624]/5 border border-[#175624]/15 text-[#175624] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#175624] group-hover:text-white dark:from-[#dfb962]/15 dark:to-[#dfb962]/5 dark:border-[#dfb962]/20 dark:text-[#dfb962] dark:group-hover:bg-[#dfb962] dark:group-hover:text-[#080e0a]">
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="font-mono text-xs font-black text-[#175624] dark:text-[#dfb962] rounded-lg bg-[#175624]/10 dark:bg-[#dfb962]/10 px-2.5 py-1">
                          {item.step}
                        </span>
                      </div>

                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#A4873E] dark:text-[#dfb962] block mb-1">
                        {item.badge}
                      </span>
                      <h3 className="text-base font-bold text-[#175624] dark:text-white mb-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#333333]/85 leading-relaxed dark:text-slate-300">
                        {item.desc}
                      </p>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* 3D INTERACTIVE WEALTH SHOWCASE */}
      <section className="relative w-full bg-[#edf3ee] py-24 px-4 transition-colors dark:bg-[#0c140e]">
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 text-left">
              <ScrollReveal direction="left" distance={30} blur>
                <span className="text-xs font-bold uppercase tracking-wider text-[#A4873E] dark:text-[#dfb962]">
                  FinCoach Obsidian Tier
                </span>
                <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#175624] dark:text-white">
                  Intelligent wealth engineering in your pocket
                </h2>
                <p className="mt-3 text-xs sm:text-sm text-[#333333]/85 leading-relaxed dark:text-slate-300">
                  FinCoach pairs autonomous financial coaching with military-grade privacy. Your statements are processed in-memory with PostgreSQL Row-Level Security, generating real-time FinScores (0–1000) and predictive 6-month What-If runaways.
                </p>
              </ScrollReveal>

              <ScrollReveal direction="up" distance={25} delay={0.15} blur scale>
                <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-[#d8e2d9] bg-white p-3.5 shadow-xs dark:border-white/10 dark:bg-[#111a13]">
                    <span className="text-[10px] uppercase font-bold text-[#A4873E] dark:text-[#dfb962] block">
                      Diagnostic Score
                    </span>
                    <span className="text-base font-black text-[#175624] dark:text-[#dfb962] font-tabular">
                      845 / 1000
                    </span>
                    <span className="text-[10px] text-slate-500 block">Grade A+ Health</span>
                  </div>
                  <div className="rounded-xl border border-[#d8e2d9] bg-white p-3.5 shadow-xs dark:border-white/10 dark:bg-[#111a13]">
                    <span className="text-[10px] uppercase font-bold text-[#A4873E] dark:text-[#dfb962] block">
                      Data Encryption
                    </span>
                    <span className="text-base font-black text-[#175624] dark:text-white">
                      256-bit AES
                    </span>
                    <span className="text-[10px] text-slate-500 block">RLS Tenant Isolated</span>
                  </div>
                </div>

                <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#A4873E]" />
                  <span>Move cursor over the metal card to tilt in 3D · Click to flip</span>
                </p>
              </ScrollReveal>
            </div>

            <div className="lg:col-span-6 flex justify-center items-center py-4">
              <ScrollReveal direction="right" distance={45} delay={0.15} blur scale>
                <WealthCard3D cardHolder="DIPANSHU SHARMA" finScore={845} />
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section id="features" className="w-full py-20 px-4 transition-colors">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal direction="up" distance={25} blur>
            <div className="text-center mb-14">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A4873E] dark:text-[#dfb962]">
                Capabilities
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#175624] dark:text-white">
                Built for precision and daily utility
              </h2>
            </div>
          </ScrollReveal>

          <StaggerContainer
            staggerDelay={0.12}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
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
            ].map((f, idx) => {
              const Icon = f.icon;
              return (
                <StaggerItem
                  key={f.title}
                  index={idx}
                  direction="up"
                  distance={30}
                  blur
                  scale
                  className="h-full"
                >
                  <div className="group h-full rounded-2xl border border-[#E5E6F9] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#A4873E]/50 hover:shadow-md dark:border-white/[0.06] dark:bg-[#111a13] dark:hover:border-[#dfb962]/40">
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
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* RESPONSIVE BOTANICAL ORNAMENTAL DIVIDER */}
      <ScrollReveal direction="up" distance={20} blur>
        <OrnamentalDivider />
      </ScrollReveal>

      {/* SECURITY CALLOUT */}
      <section id="security" className="w-full bg-transparent py-16 px-4 transition-colors">
        <ScrollReveal direction="up" distance={32} blur scale>
          <div className="group mx-auto max-w-4xl rounded-3xl border border-[#E5E6F9] bg-white/90 p-7 sm:p-9 text-center shadow-sm backdrop-blur-md transition-all duration-300 hover:border-[#A4873E]/50 hover:shadow-lg dark:border-white/[0.08] dark:bg-[#111a13] dark:hover:border-[#dfb962]/30">
            <div className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#175624] to-[#0c3114] text-[#dfb962] shadow-xs transition-transform duration-300 group-hover:scale-110 dark:from-[#dfb962] dark:to-[#b8953d] dark:text-[#080e0a]">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-[#175624] dark:text-white">
              Row-Level Data Isolation
            </h3>
            <p className="mt-2 max-w-md mx-auto text-xs text-[#333333]/85 leading-relaxed dark:text-slate-400">
              Transactions are stored in PostgreSQL with strict Row-Level Security policies. Only your authenticated session can access your financial ledger.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* HIGH-VALUE STREAMLINED FOOTER IN BLACK */}
      <footer className="relative z-20 mt-auto w-full border-t border-white/10 bg-black text-white pt-16 pb-12 px-4 transition-colors">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12">
            {/* Col 1: Brand & Operational Mission */}
            <div className="md:col-span-5 space-y-4">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#175624] to-[#0c3114] text-[#dfb962] shadow-sm ring-1 ring-white/15">
                  <TrendingUp className="h-4.5 w-4.5 stroke-[2.5]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-base tracking-tight text-white leading-none">
                    FinCoach <span className="text-[#dfb962]">AI</span>
                  </span>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-[#dfb962]/80 mt-0.5">
                    Autonomous Wealth OS
                  </span>
                </div>
              </Link>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Engineered for personal wealth clarity. Universal statement parsing, adaptive merchant memory, and autonomous Indian tax guidance without spreadsheet maintenance.
              </p>
              {/* Live Operational Status Indicator */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>System Operational · Supabase RLS Active</span>
              </div>
            </div>

            {/* Col 2: Core Platform Links */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#dfb962]">
                Platform
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
                <li>
                  <Link href="/dashboard" className="transition-colors hover:text-white flex items-center gap-1.5">
                    <span>Executive Dashboard</span>
                    <ArrowUpRight className="h-3 w-3 opacity-60" />
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/coach" className="transition-colors hover:text-white flex items-center gap-1.5">
                    <span>Autonomous CA & Tax Desk</span>
                    <ArrowUpRight className="h-3 w-3 opacity-60" />
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => document.getElementById("workflow")?.scrollIntoView({ behavior: "smooth" })}
                    className="transition-colors hover:text-white text-left cursor-pointer"
                  >
                    Universal Bank Parser (PDF/XLSX)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                    className="transition-colors hover:text-white text-left cursor-pointer"
                  >
                    Merchant Memory Engine
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Privacy & Security Guarantee */}
            <div className="md:col-span-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#dfb962]">
                Privacy & Data Trust
              </h4>
              <div className="space-y-2.5 text-xs text-slate-400">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-200">Non-Custodial:</strong> We never ask for or store bank login passwords, net-banking PINs, or SMS OTPs.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-[#dfb962] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-200">Tenant Isolation:</strong> Ledger records are isolated via PostgreSQL Row-Level Security, accessible only by your session.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Compliance */}
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} FinCoach AI. Grounded in Indian Union Budget & Statutory Tax Rules.</p>
            <div className="flex items-center gap-6">
              <Link href="/login" className="hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="hover:text-white transition-colors">
                Register Free
              </Link>
              <span className="text-emerald-400 font-medium">Zero-Ad Guarantee</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
