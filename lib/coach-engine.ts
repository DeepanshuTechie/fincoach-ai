import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ""
);

export interface FinScoreResult {
  score: number; // 0 to 1000
  grade: "A+" | "A" | "B" | "C" | "D";
  statusText: string;
  breakdown: {
    savingsRateScore: number; // Max 300
    essentialRatioScore: number; // Max 250 (50/30/20 rule)
    discretionaryDiscipline: number; // Max 200
    subscriptionBurdenScore: number; // Max 150
    emergencyBufferScore: number; // Max 100
  };
  metrics: {
    monthlyIncome: number;
    monthlyExpense: number;
    savingsRatePercent: number;
    needsRatioPercent: number;
    wantsRatioPercent: number;
    burnRatePerDay: number;
    runwayDays: number;
  };
}

export interface AffordabilitySimulation {
  itemName: string;
  cost: number;
  isEmi: boolean;
  emiMonths: number;
  monthlyEmiAmount: number;
  verdict: "safe" | "caution" | "danger";
  headline: string;
  explanation: string;
  impactMetrics: {
    currentMonthlySavings: number;
    projectedMonthlySavingsWithItem: number;
    savingsReductionPercent: number;
    currentRunwayDays: number;
    projectedRunwayDays: number;
    minimumProjectedBalance: number;
  };
  timeline: Array<{
    month: string;
    baselineBalance: number;
    projectedBalance: number;
    safetyThreshold: number;
  }>;
  coachAdvice: string;
}

export interface CoachActionPlan {
  headline: string;
  weeklyMissions: Array<{
    title: string;
    description: string;
    potentialSavings: number;
    category: string;
    difficulty: "Easy" | "Medium" | "Challenging";
  }>;
  opportunityCostNote: string;
}

interface RawTxn {
  id: string;
  description: string;
  amount: number;
  transaction_date: string;
  category_id?: string | null;
  categories?: { name: string; color?: string } | null;
}

/**
 * 1. Computes the Proprietary FinScore (0–1000) using 5-Factor Financial Health Analysis
 */
export function calculateFinScore(transactions: RawTxn[]): FinScoreResult {
  if (!transactions || transactions.length === 0) {
    return {
      score: 500,
      grade: "C",
      statusText: "Awaiting statement upload to compute initial baseline FinScore.",
      breakdown: {
        savingsRateScore: 150,
        essentialRatioScore: 125,
        discretionaryDiscipline: 100,
        subscriptionBurdenScore: 75,
        emergencyBufferScore: 50,
      },
      metrics: {
        monthlyIncome: 0,
        monthlyExpense: 0,
        savingsRatePercent: 0,
        needsRatioPercent: 0,
        wantsRatioPercent: 0,
        burnRatePerDay: 0,
        runwayDays: 0,
      },
    };
  }

  let totalIncome = 0;
  let totalExpense = 0;
  let needsSpend = 0; // Rent, Utilities, Food groceries
  let wantsSpend = 0; // Shopping, Entertainment, Dining out
  let subscriptionSpend = 0;

  transactions.forEach((t) => {
    const catName = t.categories?.name || "Other";
    const amt = Number(t.amount) || 0;

    if (catName === "Income") {
      totalIncome += amt;
    } else {
      totalExpense += amt;

      if (catName === "Rent & Housing" || catName === "Utilities" || catName === "Medicine") {
        needsSpend += amt;
      } else if (catName === "Subscriptions") {
        subscriptionSpend += amt;
        needsSpend += amt * 0.5;
        wantsSpend += amt * 0.5;
      } else if (catName === "Food & Dining") {
        // Groceries vs dining out split
        needsSpend += amt * 0.5;
        wantsSpend += amt * 0.5;
      } else {
        wantsSpend += amt;
      }
    }
  });

  // Normalize monthly estimates if span is known or use baseline
  const effectiveIncome = Math.max(totalIncome, totalExpense * 1.05); // Avoid div/0
  const savings = Math.max(0, effectiveIncome - totalExpense);
  const savingsRate = Math.min(1, savings / effectiveIncome);

  // 1. Savings Rate Score (Max 300) - Target >= 25% savings
  const savingsScore = Math.round(Math.min(300, (savingsRate / 0.25) * 300));

  // 2. 50/30/20 Rule Compliance (Max 250) - Needs <= 50%, Wants <= 30%
  const needsRatio = needsSpend / (totalExpense || 1);
  const wantsRatio = wantsSpend / (totalExpense || 1);
  let essentialScore = 250;
  if (needsRatio > 0.6) essentialScore -= Math.min(80, (needsRatio - 0.6) * 200);
  if (wantsRatio > 0.35) essentialScore -= Math.min(100, (wantsRatio - 0.35) * 250);
  essentialScore = Math.max(50, Math.round(essentialScore));

  // 3. Discretionary Impulse Discipline (Max 200)
  const impulseRatio = wantsSpend / effectiveIncome;
  let disciplineScore = 200;
  if (impulseRatio > 0.3) {
    disciplineScore = Math.max(40, Math.round(200 - (impulseRatio - 0.3) * 300));
  }

  // 4. Subscription Burden Score (Max 150) - Should be < 8% of income
  const subRatio = subscriptionSpend / effectiveIncome;
  let subScore = 150;
  if (subRatio > 0.08) {
    subScore = Math.max(30, Math.round(150 - (subRatio - 0.08) * 400));
  }

  // 5. Emergency Buffer Cushion (Max 100)
  const netSurplus = totalIncome - totalExpense;
  let bufferScore = 75;
  if (netSurplus > 20000) bufferScore = 100;
  else if (netSurplus < 0) bufferScore = 30;

  const totalScore = Math.min(1000, Math.max(250, savingsScore + essentialScore + disciplineScore + subScore + bufferScore));

  let grade: "A+" | "A" | "B" | "C" | "D" = "B";
  let statusText = "Healthy Financial Cadence";

  if (totalScore >= 850) {
    grade = "A+";
    statusText = "Elite Financial Disciplined — Outstanding surplus compounding.";
  } else if (totalScore >= 750) {
    grade = "A";
    statusText = "Strong Financial Health — Reliable savings rate and disciplined expenses.";
  } else if (totalScore >= 620) {
    grade = "B";
    statusText = "Moderate Stability — Room to optimize discretionary and subscription leaks.";
  } else if (totalScore >= 500) {
    grade = "C";
    statusText = "Vulnerable Buffer — Cashflow is tight; impulse spends require attention.";
  } else {
    grade = "D";
    statusText = "Deficit Danger — Burn rate exceeds retained cashflow. Austerity recommended.";
  }

  const burnRate = Math.round(totalExpense / 30);
  const runway = burnRate > 0 ? Math.round(Math.max(0, netSurplus > 0 ? netSurplus / burnRate + 30 : 15)) : 90;

  return {
    score: totalScore,
    grade,
    statusText,
    breakdown: {
      savingsRateScore: savingsScore,
      essentialRatioScore: essentialScore,
      discretionaryDiscipline: disciplineScore,
      subscriptionBurdenScore: subScore,
      emergencyBufferScore: bufferScore,
    },
    metrics: {
      monthlyIncome: Math.round(totalIncome),
      monthlyExpense: Math.round(totalExpense),
      savingsRatePercent: Math.round(savingsRate * 100),
      needsRatioPercent: Math.round(needsRatio * 100),
      wantsRatioPercent: Math.round(wantsRatio * 100),
      burnRatePerDay: burnRate,
      runwayDays: runway,
    },
  };
}

/**
 * 2. Simulates "Can I Afford This?" What-If Decision Engine (6-Month Projection)
 */
export function simulateAffordability(
  transactions: RawTxn[],
  currentBalance: number,
  itemName: string,
  cost: number,
  isEmi: boolean,
  emiMonths: number = 6
): AffordabilitySimulation {
  const finScore = calculateFinScore(transactions);
  const monthlyIncome = finScore.metrics.monthlyIncome || 50000;
  const monthlyExpense = finScore.metrics.monthlyExpense || 32000;
  const monthlySurplus = Math.max(0, monthlyIncome - monthlyExpense);

  const monthlyEmi = isEmi && emiMonths > 0 ? Math.round(cost / emiMonths) : 0;
  const upfrontCost = isEmi ? 0 : cost;

  // Generate 6-Month Projected Timeline
  const months = ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"];
  const safetyThreshold = Math.max(15000, Math.round(monthlyExpense * 0.4)); // 40% of 1-mo expense as emergency floor

  let runningBaseline = Math.max(currentBalance, 25000);
  let runningProjected = runningBaseline - upfrontCost;

  const timeline: Array<{
    month: string;
    baselineBalance: number;
    projectedBalance: number;
    safetyThreshold: number;
  }> = [];

  let minProjected = runningProjected;

  months.forEach((m, idx) => {
    runningBaseline += monthlySurplus;

    const emiDeduction = isEmi && idx < emiMonths ? monthlyEmi : 0;
    runningProjected += monthlySurplus - emiDeduction;

    if (runningProjected < minProjected) {
      minProjected = runningProjected;
    }

    timeline.push({
      month: m,
      baselineBalance: Math.round(runningBaseline),
      projectedBalance: Math.round(runningProjected),
      safetyThreshold,
    });
  });

  // Calculate Impact Metrics
  const projectedSurplusWithItem = Math.max(0, monthlySurplus - (isEmi ? monthlyEmi : cost / 6));
  const savingsReduction = monthlySurplus > 0 ? Math.round(((monthlySurplus - projectedSurplusWithItem) / monthlySurplus) * 100) : 100;

  let verdict: "safe" | "caution" | "danger" = "safe";
  let headline = "";
  let explanation = "";
  let coachAdvice = "";

  if (minProjected < safetyThreshold * 0.5 || (isEmi && monthlyEmi > monthlySurplus * 0.85)) {
    verdict = "danger";
    headline = "High Financial Danger — Deficit Inevitable";
    explanation = isEmi
      ? `An EMI of ₹${monthlyEmi.toLocaleString("en-IN")}/mo consumes ${Math.round((monthlyEmi / (monthlySurplus || 1)) * 100)}% of your discretionary surplus. Your balance will dip dangerously near zero.`
      : `An upfront expense of ₹${cost.toLocaleString("en-IN")} depletes your cash reserve below safety threshold (₹${safetyThreshold.toLocaleString("en-IN")}).`;
    coachAdvice = `Coach Directive: Postpone "${itemName}" by at least 90 days. Set up a Sinking Fund saving ₹${Math.round(cost / 4).toLocaleString("en-IN")}/mo for 4 months to purchase with zero debt risk.`;
  } else if (minProjected < safetyThreshold || (isEmi && monthlyEmi > monthlySurplus * 0.5)) {
    verdict = "caution";
    headline = "Moderate Risk — Buffer Stretched";
    explanation = isEmi
      ? `You can service the ₹${monthlyEmi.toLocaleString("en-IN")}/mo EMI, but your monthly savings cushion drops by ${savingsReduction}%. Any unplanned medical or home emergency will stress your cashflow.`
      : `This ₹${cost.toLocaleString("en-IN")} purchase is doable, but reduces your cash runway from ${finScore.metrics.runwayDays} days to approximately ${Math.round(finScore.metrics.runwayDays * 0.65)} days.`;
    coachAdvice = `Coach Directive: Proceed ONLY if you compensate by cutting Food Delivery (Swiggy/Zomato) or discretionary shopping by ₹${Math.round(monthlyEmi * 0.4).toLocaleString("en-IN")}/mo during the tenure.`;
  } else {
    verdict = "safe";
    headline = "Safe to Purchase — Healthy Buffer Retained";
    explanation = isEmi
      ? `Your ₹${monthlySurplus.toLocaleString("en-IN")}/mo surplus comfortably absorbs the ₹${monthlyEmi.toLocaleString("en-IN")}/mo EMI with over ₹${(monthlySurplus - monthlyEmi).toLocaleString("en-IN")} residual savings remaining.`
      : `Your cashflow easily cushions this ₹${cost.toLocaleString("en-IN")} expense without breaching your safety buffer floor of ₹${safetyThreshold.toLocaleString("en-IN")}.`;
    coachAdvice = `Coach Green Light: Approved! You maintain positive cashflow throughout all 6 projection cycles. Consider paying with a cashback card to capture reward savings.`;
  }

  return {
    itemName,
    cost,
    isEmi,
    emiMonths,
    monthlyEmiAmount: monthlyEmi,
    verdict,
    headline,
    explanation,
    impactMetrics: {
      currentMonthlySavings: Math.round(monthlySurplus),
      projectedMonthlySavingsWithItem: Math.round(projectedSurplusWithItem),
      savingsReductionPercent: Math.min(100, savingsReduction),
      currentRunwayDays: finScore.metrics.runwayDays,
      projectedRunwayDays: Math.max(10, Math.round(finScore.metrics.runwayDays * (1 - savingsReduction / 160))),
      minimumProjectedBalance: Math.round(minProjected),
    },
    timeline,
    coachAdvice,
  };
}

// High-performance Coach Plan Cache
const coachPlanCache = new Map<string, { plan: CoachActionPlan; timestamp: number }>();
const COACH_CACHE_TTL = 10 * 60 * 1000;

/**
 * 3. AI Persona-driven Weekly Coaching Drills
 */
export async function generatePersonaCoachPlan(
  transactions: RawTxn[],
  persona: "shark" | "buffett" | "zen" = "shark",
  instantOnly: boolean = false
): Promise<CoachActionPlan> {
  const finScore = calculateFinScore(transactions);

  // Fast cache fingerprint
  const cacheKey = `${persona}_${transactions.length}_${finScore.score}`;
  const cached = coachPlanCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < COACH_CACHE_TTL) {
    return cached.plan;
  }

  // Programmatic high-precision plan (0ms response)
  const defaultPlan: CoachActionPlan = {
    headline:
      persona === "shark"
        ? `You're burning ₹${finScore.metrics.burnRatePerDay}/day! Time to plug discretionary leaks and build a fortress.`
        : persona === "buffett"
        ? `Your retained savings rate is ${finScore.metrics.savingsRatePercent}%. Every ₹1,000 saved today is ₹1,760 in 5 years.`
        : `You are in a stable position with ${finScore.metrics.runwayDays} days of runway. Small shifts this week will unlock peace of mind.`,
    weeklyMissions: [
      {
        title: "Cap Convenience Food Deliveries",
        description: "Switch 2 weekday food deliveries to home meals. High delivery fees and surcharges drain cash silently.",
        potentialSavings: 2400,
        category: "Food & Dining",
        difficulty: "Easy",
      },
      {
        title: "Audit Autopay Subscriptions",
        description: "Review recurring streaming or digital passes. Pause at least one non-essential service this month.",
        potentialSavings: 649,
        category: "Subscriptions",
        difficulty: "Easy",
      },
      {
        title: "Enforce the 48-Hour Cart Rule",
        description: "Wait 48 hours before purchasing any non-essential item over ₹1,000. 70% of impulse urge evaporates.",
        potentialSavings: 3500,
        category: "Shopping",
        difficulty: "Medium",
      },
    ],
    opportunityCostNote: `Deploying these combined savings (₹6,549/mo) into an index fund yields ~₹5.2 Lakhs in 5 years.`,
  };

  if (instantOnly) {
    coachPlanCache.set(cacheKey, { plan: defaultPlan, timestamp: Date.now() });
    return defaultPlan;
  }

  // Group high merchants
  const merchantTotals = new Map<string, number>();
  transactions.forEach((t) => {
    if (t.categories?.name !== "Income") {
      const desc = t.description.trim();
      merchantTotals.set(desc, (merchantTotals.get(desc) || 0) + Number(t.amount));
    }
  });

  const sortedMerchants = Array.from(merchantTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topSpendsSummary = sortedMerchants
    .map(([m, amt]) => `${m}: ₹${amt}`)
    .join(", ") || "No major merchant outliers";

  const personaContext =
    persona === "shark"
      ? "You are a tough, no-nonsense Shark Tank financial coach. You hate wasted money on food delivery, idle subscriptions, and impulsive gadgets. You call out leaks directly with punchy wit and high urgency."
      : persona === "buffett"
      ? "You are a disciplined Value Investor coach inspired by Warren Buffett and Charlie Munger. You focus on opportunity cost, compound interest, avoiding debt, and turning leaks into high-yield investments."
      : "You are an empathetic, constructive Mindful Money Guide. You understand students and young professionals have lifestyle desires. You encourage balance, small actionable steps, and celebrating micro-wins without guilt.";

  const prompt = `${personaContext}
Analyze this user's financial profile:
- Monthly Inflow: ₹${finScore.metrics.monthlyIncome}
- Monthly Outflow: ₹${finScore.metrics.monthlyExpense}
- FinScore: ${finScore.score}/1000 (${finScore.grade})
- Savings Rate: ${finScore.metrics.savingsRatePercent}%
- Daily Burn Rate: ₹${finScore.metrics.burnRatePerDay}/day
- Top Spend Outliers: ${topSpendsSummary}

Create a personalized 3-Mission Weekly Coaching Plan.
Return ONLY valid JSON matching this schema:
{
  "headline": "Short bold statement (1 sentence) summarizing their financial state in your persona voice",
  "weeklyMissions": [
    {
      "title": "Action title (e.g. 'Audit Food Delivery Cap', 'Cancel 1 Zombie Subscription')",
      "description": "Specific tactical guidance (2 sentences) naming real numbers or actions",
      "potentialSavings": number (estimated monthly savings in INR, e.g. 1500),
      "category": "Food & Dining | Subscriptions | Shopping | Utilities",
      "difficulty": "Easy | Medium | Challenging"
    }
  ],
  "opportunityCostNote": "1 sharp sentence showing what those total savings would become in 5 years if invested at 12% CAGR"
}`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 600,
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed: CoachActionPlan = JSON.parse(text);

    if (parsed.headline && Array.isArray(parsed.weeklyMissions)) {
      coachPlanCache.set(cacheKey, { plan: parsed, timestamp: Date.now() });
      return parsed;
    }
  } catch (err) {
    console.warn("Gemini Coach Plan fallback:", err);
  }

  coachPlanCache.set(cacheKey, { plan: defaultPlan, timestamp: Date.now() });
  return defaultPlan;
}
