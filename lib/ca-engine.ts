import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  TAX_REGISTRY,
  DEFAULT_FISCAL_YEAR,
  calculateTaxFromSlabs,
  FinancialYearTaxRules,
  getTaxRule,
} from "./tax-rules";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export interface RawTxn {
  id: string;
  description: string;
  amount: number;
  transaction_date: string;
  category_id?: string | null;
  categories?: { name: string; color?: string } | null;
}

export interface TaxAuditResult {
  fiscalYear: string;
  budgetAnnouncement: string;
  estimatedAnnualIncome: number;
  newRegimeTax: number;
  oldRegimeTax: number;
  taxDifference: number;
  existingDeductions: {
    section80C: number;
    section80D: number;
    section80CCD: number;
    hraEstimated: number;
  };
  untappedDeductions: {
    section80CRemaining: number;
    section80DRemaining: number;
    section80CCDRemaining: number;
    totalUntapped: number;
  };
  taxSavingsPotential: number;
  recommendedRegime: "New Regime (115BAC)" | "Old Regime (With Deductions)";
  regimeAnalysis: string;
  actionableTaxTips: string[];
}

export interface FoirAuditResult {
  monthlyInflow: number;
  monthlyFixedObligations: number;
  foirPercent: number;
  status: "Safe (<35%)" | "Moderate (35-50%)" | "Critical Risk (>50%)";
  verdictColor: "emerald" | "amber" | "rose";
  maxSafeAdditionalEmi: number;
  recommendation: string;
}

export interface EmergencyFundAudit {
  monthlyEssentialExpense: number;
  threeMonthTarget: number;
  sixMonthTarget: number;
  currentEstimatedBuffer: number;
  fundedPercentage: number;
  status: "Well Funded" | "Partially Protected" | "Vulnerable";
  recommendation: string;
}

export interface AssetAllocationPlan {
  monthlyInvestibleSurplus: number;
  recommendations: Array<{
    assetClass: string;
    percentage: number;
    amount: number;
    rationale: string;
    suggestedInstruments: string;
  }>;
  projectedFiveYearCorpus: number;
}

export interface FullCAAuditReport {
  taxAudit: TaxAuditResult;
  foirAudit: FoirAuditResult;
  emergencyFund: EmergencyFundAudit;
  assetAllocation: AssetAllocationPlan;
  caSummaryNotes: string[];
}

/**
 * 1. Computes Indian Income Tax & Deductions Audit using Dynamic Versioned Rules
 */
export function auditTaxAndDeductions(
  transactions: RawTxn[],
  fiscalYear: string = DEFAULT_FISCAL_YEAR
): TaxAuditResult {
  const rules: FinancialYearTaxRules = getTaxRule(fiscalYear);

  let monthlyIncome = 0;
  let detectedRent = 0;
  let detected80C = 0;
  let detected80D = 0;
  let detectedNps = 0;

  transactions.forEach((t) => {
    const amt = Number(t.amount) || 0;
    const cat = t.categories?.name || "";
    const desc = (t.description || "").toLowerCase();

    if (cat === "Income") {
      monthlyIncome += amt;
    }

    if (cat === "Rent & Housing" || desc.includes("rent") || desc.includes("landlord")) {
      detectedRent += amt;
    }

    if (
      desc.includes("ppf") ||
      desc.includes("elss") ||
      desc.includes("lic") ||
      desc.includes("provident") ||
      desc.includes("tax saver") ||
      desc.includes("sukanya")
    ) {
      detected80C += amt;
    }

    if (
      desc.includes("health ins") ||
      desc.includes("mediclaim") ||
      desc.includes("star health") ||
      desc.includes("care health") ||
      desc.includes("hdfc ergo")
    ) {
      detected80D += amt;
    }

    if (desc.includes("nps") || desc.includes("pension") || desc.includes("cra-nsdl")) {
      detectedNps += amt;
    }
  });

  const effectiveMonthly = monthlyIncome > 0 ? monthlyIncome : 65000;
  const grossAnnualIncome = effectiveMonthly * 12;

  // Limits from dynamic rules registry
  const max80C = rules.oldRegime.deductions.section80CMax;
  const max80D = rules.oldRegime.deductions.section80DMaxSelf;
  const maxNps = rules.oldRegime.deductions.section80CCD1BMax;

  const annual80C = Math.min(max80C, detected80C > 0 ? detected80C * 12 : 25000);
  const annual80D = Math.min(max80D, detected80D > 0 ? detected80D * 12 : 8000);
  const annualNps = Math.min(maxNps, detectedNps > 0 ? detectedNps * 12 : 0);
  const annualRent = detectedRent > 0 ? detectedRent * 12 : 120000;

  const rem80C = Math.max(0, max80C - annual80C);
  const rem80D = Math.max(0, max80D - annual80D);
  const remNps = Math.max(0, maxNps - annualNps);
  const totalUntapped = rem80C + rem80D + remNps;

  // 1. CALCULATE TAX UNDER NEW REGIME (Section 115BAC)
  const newRegimeTaxable = Math.max(0, grossAnnualIncome - rules.newRegime.standardDeduction);
  let newRegimeTax = calculateTaxFromSlabs(newRegimeTaxable, rules.newRegime.slabs);
  if (grossAnnualIncome <= rules.newRegime.rebate87ALimit) {
    newRegimeTax = 0; // Section 87A rebate
  }
  newRegimeTax = Math.round(newRegimeTax * (1 + rules.healthAndEducationCess));

  // 2. CALCULATE TAX UNDER OLD REGIME (With Chapter VI-A Deductions)
  const totalDeductionsClaimed =
    annual80C + annual80D + annualNps + Math.min(annualRent * 0.4, 100000);
  const oldRegimeTaxable = Math.max(
    0,
    grossAnnualIncome - rules.oldRegime.standardDeduction - totalDeductionsClaimed
  );
  let oldRegimeTax = calculateTaxFromSlabs(oldRegimeTaxable, rules.oldRegime.slabs);
  if (grossAnnualIncome <= rules.oldRegime.rebate87ALimit) {
    oldRegimeTax = 0; // Section 87A rebate
  }
  oldRegimeTax = Math.round(oldRegimeTax * (1 + rules.healthAndEducationCess));

  const recommendedRegime: TaxAuditResult["recommendedRegime"] =
    newRegimeTax <= oldRegimeTax
      ? "New Regime (115BAC)"
      : "Old Regime (With Deductions)";

  const taxDifference = Math.abs(newRegimeTax - oldRegimeTax);

  const regimeAnalysis =
    recommendedRegime === "New Regime (115BAC)"
      ? `${rules.budgetAnnouncement}: New Tax Regime mein aapka tax ₹${newRegimeTax.toLocaleString("en-IN")} hai jabki Old Regime mein ₹${oldRegimeTax.toLocaleString("en-IN")}. New Regime chunne se aapke ₹${taxDifference.toLocaleString("en-IN")} bachenge.`
      : `${rules.budgetAnnouncement}: Aapke total deductions (80C, 80D, HRA) ₹${Math.round(totalDeductionsClaimed).toLocaleString("en-IN")} hain. Old Regime mein ₹${oldRegimeTax.toLocaleString("en-IN")} tax banta hai jabki New Regime mein ₹${newRegimeTax.toLocaleString("en-IN")}. Old Regime se aapke ₹${taxDifference.toLocaleString("en-IN")} bachenge.`;

  const taxSavingsPotential = Math.round(totalUntapped * 0.208);

  const actionableTaxTips = [
    `Section 80C: ₹${rem80C.toLocaleString("en-IN")} ka room bacha hai (Limit: ₹${max80C.toLocaleString("en-IN")}). ELSS mutual funds ya PPF mein invest karein.`,
    `Section 80D: Self/Family ke liye ₹${rem80D.toLocaleString("en-IN")} tak Health Mediclaim premium claim karein.`,
    `Section 80CCD(1B): NPS mein additional ₹${maxNps.toLocaleString("en-IN")} invest karke 80C ke upar extra tax deduction claim karein.`,
    `Current Framework: Evaluated under ${rules.fiscalYear} (${rules.budgetAnnouncement}).`,
  ];

  return {
    fiscalYear: rules.fiscalYear,
    budgetAnnouncement: rules.budgetAnnouncement,
    estimatedAnnualIncome: Math.round(grossAnnualIncome),
    newRegimeTax,
    oldRegimeTax,
    taxDifference,
    existingDeductions: {
      section80C: Math.round(annual80C),
      section80D: Math.round(annual80D),
      section80CCD: Math.round(annualNps),
      hraEstimated: Math.round(annualRent),
    },
    untappedDeductions: {
      section80CRemaining: Math.round(rem80C),
      section80DRemaining: Math.round(rem80D),
      section80CCDRemaining: Math.round(remNps),
      totalUntapped: Math.round(totalUntapped),
    },
    taxSavingsPotential,
    recommendedRegime,
    regimeAnalysis,
    actionableTaxTips,
  };
}

/**
 * 2. Computes FOIR (Fixed Obligation to Income Ratio) & Debt Capacity
 */
export function auditFoirAndDebt(transactions: RawTxn[]): FoirAuditResult {
  let monthlyInflow = 0;
  let fixedObligations = 0;

  transactions.forEach((t) => {
    const amt = Number(t.amount) || 0;
    const cat = t.categories?.name || "";
    const desc = (t.description || "").toLowerCase();

    if (cat === "Income") {
      monthlyInflow += amt;
    }

    if (
      cat === "Rent & Housing" ||
      desc.includes("emi") ||
      desc.includes("loan") ||
      desc.includes("bajaj fin") ||
      desc.includes("hdb") ||
      desc.includes("cred") ||
      desc.includes("car loan") ||
      desc.includes("home loan")
    ) {
      fixedObligations += amt;
    }
  });

  const effectiveInflow = Math.max(monthlyInflow, 50000);
  const foirPercent = Math.round((fixedObligations / effectiveInflow) * 100);

  let status: FoirAuditResult["status"] = "Safe (<35%)";
  let verdictColor: FoirAuditResult["verdictColor"] = "emerald";
  let recommendation =
    "Aapka debt commitments safe boundary (<35%) ke andar hai. Aapke paas emergency reserves aur growth capital ke liye kaafi room hai.";

  if (foirPercent > 50) {
    status = "Critical Risk (>50%)";
    verdictColor = "rose";
    recommendation =
      "Alert: Income ka 50% se zyada hissa fixed commitments mein chala jata hai. Nayi EMI bilkul na lein aur prepayment strategy shuru karein.";
  } else if (foirPercent >= 35) {
    status = "Moderate (35-50%)";
    verdictColor = "amber";
    recommendation =
      "Aapka debt caution zone mein hai. Agle 6 mahine koi high-ticket luxury EMI add na karein.";
  }

  const maxSafeFoirAmt = effectiveInflow * 0.4;
  const maxSafeAdditionalEmi = Math.max(0, Math.round(maxSafeFoirAmt - fixedObligations));

  return {
    monthlyInflow: Math.round(effectiveInflow),
    monthlyFixedObligations: Math.round(fixedObligations),
    foirPercent,
    status,
    verdictColor,
    maxSafeAdditionalEmi,
    recommendation,
  };
}

/**
 * 3. Computes Emergency Cushion Buffer & Survival Runway
 */
export function auditEmergencyBuffer(transactions: RawTxn[]): EmergencyFundAudit {
  let monthlyEssential = 0;
  let totalInflow = 0;
  let totalOutflow = 0;

  transactions.forEach((t) => {
    const amt = Number(t.amount) || 0;
    const cat = t.categories?.name || "";

    if (cat === "Income") {
      totalInflow += amt;
    } else {
      totalOutflow += amt;
      if (
        cat === "Rent & Housing" ||
        cat === "Utilities" ||
        cat === "Medicine" ||
        cat === "Food & Dining"
      ) {
        monthlyEssential += amt * 0.8;
      }
    }
  });

  const effectiveEssential = Math.max(monthlyEssential, 20000);
  const threeMonthTarget = Math.round(effectiveEssential * 3);
  const sixMonthTarget = Math.round(effectiveEssential * 6);

  const estimatedSurplus = Math.max(15000, totalInflow - totalOutflow + 25000);
  const fundedPercentage = Math.min(100, Math.round((estimatedSurplus / sixMonthTarget) * 100));

  let status: EmergencyFundAudit["status"] = "Partially Protected";
  let recommendation = `Aapka emergency reserve 3 mahine ke basic kharche ke kareeb hai. Target: ₹${sixMonthTarget.toLocaleString("en-IN")} tak le jayein.`;

  if (fundedPercentage >= 80) {
    status = "Well Funded";
    recommendation = `Shabaash! Aapka emergency reserve 6 mahine ke standard buffer ko meet karta hai. Extra paisa index funds mein deploy karein.`;
  } else if (fundedPercentage < 40) {
    status = "Vulnerable";
    recommendation = `Warning: Income aana band ho toh 45 din se kam ka cash bachega. Sabse pehle ₹${threeMonthTarget.toLocaleString("en-IN")} liquid FD mein save karein.`;
  }

  return {
    monthlyEssentialExpense: Math.round(effectiveEssential),
    threeMonthTarget,
    sixMonthTarget,
    currentEstimatedBuffer: Math.round(estimatedSurplus),
    fundedPercentage,
    status,
    recommendation,
  };
}

/**
 * 4. Generates Asset Allocation & 5-Year Compounding Growth Plan
 */
export function generateAssetAllocation(
  transactions: RawTxn[],
  monthlyInflow: number,
  monthlyOutflow: number
): AssetAllocationPlan {
  const surplus = Math.max(5000, monthlyInflow - monthlyOutflow);

  const recommendations = [
    {
      assetClass: "Nifty 50 / Large-Cap Index Fund",
      percentage: 50,
      amount: Math.round(surplus * 0.5),
      rationale: "Core wealth compounding with historical 12-14% CAGR and lowest expense ratio.",
      suggestedInstruments: "UTI Nifty 50 Index Fund / HDFC Index Fund",
    },
    {
      assetClass: "Flexi-Cap / Mid-Cap Equity",
      percentage: 25,
      amount: Math.round(surplus * 0.25),
      rationale: "Alpha generator across Indian emerging mid-sized growth leaders.",
      suggestedInstruments: "Parag Parikh Flexi Cap / Motilal Oswal Midcap",
    },
    {
      assetClass: "Liquid Reserve / Sweep-in FD",
      percentage: 15,
      amount: Math.round(surplus * 0.15),
      rationale: "Immediate liquidity without market volatility risks for sudden expenses.",
      suggestedInstruments: "Bank Auto-Sweep / Quantum Liquid Fund",
    },
    {
      assetClass: "Sovereign Gold / Micro-Hedge",
      percentage: 10,
      amount: Math.round(surplus * 0.1),
      rationale: "Inflation hedge and Rupee depreciation buffer.",
      suggestedInstruments: "Nippon Gold BeES / RBI SGBs",
    },
  ];

  const monthlyRate = 0.12 / 12;
  const months = 60;
  const fv = surplus * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);

  return {
    monthlyInvestibleSurplus: Math.round(surplus),
    recommendations,
    projectedFiveYearCorpus: Math.round(fv),
  };
}

/**
 * 5. Synthesizes Complete CA Audit Report
 */
export function generateFullCAAudit(
  transactions: RawTxn[],
  fiscalYear: string = DEFAULT_FISCAL_YEAR
): FullCAAuditReport {
  const taxAudit = auditTaxAndDeductions(transactions, fiscalYear);
  const foirAudit = auditFoirAndDebt(transactions);
  const emergencyFund = auditEmergencyBuffer(transactions);
  const assetAllocation = generateAssetAllocation(
    transactions,
    foirAudit.monthlyInflow,
    Math.round(foirAudit.monthlyInflow * 0.7)
  );

  const caSummaryNotes = [
    `Tax Slabs: Calculated under ${taxAudit.fiscalYear} rules (${taxAudit.budgetAnnouncement}).`,
    `Tax Optimization: ₹${taxAudit.untappedDeductions.totalUntapped.toLocaleString("en-IN")} worth of untapped deductions identified under 80C, 80D, and NPS.`,
    `Debt Health (FOIR): Currently at ${foirAudit.foirPercent}% (${foirAudit.status}). Safe extra monthly EMI capacity: ₹${foirAudit.maxSafeAdditionalEmi.toLocaleString("en-IN")}.`,
    `Emergency Runway: Buffer funded at ${emergencyFund.fundedPercentage}% of 6-month target (Target: ₹${emergencyFund.sixMonthTarget.toLocaleString("en-IN")}).`,
    `Compounding Potential: Disciplined SIP allocation of your surplus (₹${assetAllocation.monthlyInvestibleSurplus.toLocaleString("en-IN")}/mo) compounds to ~₹${(assetAllocation.projectedFiveYearCorpus / 100000).toFixed(1)} Lakhs in 5 years.`,
  ];

  return {
    taxAudit,
    foirAudit,
    emergencyFund,
    assetAllocation,
    caSummaryNotes,
  };
}

// High-speed Consultation In-Memory Cache
const caConsultCache = new Map<string, { answer: string; timestamp: number }>();
const CA_CACHE_TTL = 10 * 60 * 1000;

/**
 * 6. Live AI CA Interactive Consultation Endpoint
 */
export async function consultPersonalCA(
  transactions: RawTxn[],
  userQuery: string,
  fiscalYear: string = DEFAULT_FISCAL_YEAR
): Promise<string> {
  const audit = generateFullCAAudit(transactions, fiscalYear);

  const cleanQuery = userQuery.trim().toLowerCase();
  const cacheKey = `${fiscalYear}_${cleanQuery}_${transactions.length}`;
  const cached = caConsultCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CA_CACHE_TTL) {
    return cached.answer;
  }

  const prompt = `You are a certified Chartered Accountant (CA) and Senior Wealth Manager in India.
Your client asks you: "${userQuery}"

Active Fiscal Rules: ${audit.taxAudit.fiscalYear} (${audit.taxAudit.budgetAnnouncement})
Client Financial Profile:
- Net Monthly Inflow: ₹${audit.foirAudit.monthlyInflow}
- Fixed Commitments (Rent + EMIs): ₹${audit.foirAudit.monthlyFixedObligations} (FOIR: ${audit.foirAudit.foirPercent}%)
- Estimated Annual Income: ₹${audit.taxAudit.estimatedAnnualIncome}
- New Regime Tax: ₹${audit.taxAudit.newRegimeTax} vs Old Regime Tax: ₹${audit.taxAudit.oldRegimeTax} (Recommended: ${audit.taxAudit.recommendedRegime})
- Untapped Tax Deductions: ₹${audit.taxAudit.untappedDeductions.totalUntapped} (Potential Tax Saved: ₹${audit.taxAudit.taxSavingsPotential})
- Emergency Fund Status: ${audit.emergencyFund.status} (Target: ₹${audit.emergencyFund.sixMonthTarget})
- Investible Surplus: ₹${audit.assetAllocation.monthlyInvestibleSurplus}/mo

Guidelines:
1. Speak in clean, professional, and accessible Hinglish/English.
2. Cite their REAL numbers from above. No generic fluff.
3. If they ask about tax, cite Section 80C, 80D, 80CCD (NPS), and New vs Old regime under ${audit.taxAudit.fiscalYear}.
4. If they ask about buying something (car, phone, EMI), evaluate their FOIR and emergency runway.
5. Provide 3 crisp bullet points with immediate actionable next steps.
6. Keep response within 3 short paragraphs. Be fast and direct.`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 550,
      },
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    if (text) {
      caConsultCache.set(cacheKey, { answer: text, timestamp: Date.now() });
      return text;
    }
  } catch (err) {
    console.warn("Gemini CA consult fallback:", err);
  }

  const fallback = `Namaste! Based on your ${audit.taxAudit.fiscalYear} ledger audit:
• Net Monthly Inflow: ₹${audit.foirAudit.monthlyInflow.toLocaleString("en-IN")}, Fixed Commitments: ₹${audit.foirAudit.monthlyFixedObligations.toLocaleString("en-IN")} (${audit.foirAudit.foirPercent}% FOIR).
• Tax Regime: ${audit.taxAudit.regimeAnalysis}
• Deductions: Section 80C, 80D aur NPS mein total ₹${audit.taxAudit.untappedDeductions.totalUntapped.toLocaleString("en-IN")} ka unused deduction room hai (Tax savings: ₹${audit.taxAudit.taxSavingsPotential.toLocaleString("en-IN")}).
• CA Advice: New EMIs avoid karein aur investible surplus (₹${audit.assetAllocation.monthlyInvestibleSurplus.toLocaleString("en-IN")}/mo) ko emergency fund aur diversified Index SIP mein deploy karein.`;

  caConsultCache.set(cacheKey, { answer: fallback, timestamp: Date.now() });
  return fallback;
}
