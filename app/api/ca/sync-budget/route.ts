import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  FinancialYearTaxRules,
  registerTaxRule,
  AVAILABLE_FISCAL_YEARS,
  TAX_REGISTRY,
} from "@/lib/tax-rules";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

/**
 * GET: Fetches all currently loaded fiscal years and hydrates from Supabase if table exists
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
      const { data: dbRules } = await supabase
        .from("tax_rules")
        .select("rules_json")
        .order("fiscal_year", { ascending: false });

      if (dbRules && dbRules.length > 0) {
        dbRules.forEach((row) => {
          if (row.rules_json && row.rules_json.fiscalYear) {
            registerTaxRule(row.rules_json as FinancialYearTaxRules);
          }
        });
      }
    } catch {
      // Supabase table might not exist yet; fallback to static registry
    }

    return NextResponse.json({
      success: true,
      availableYears: AVAILABLE_FISCAL_YEARS,
      registry: TAX_REGISTRY,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load tax registry";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST: Autonomous AI Ingestion of a New Union Budget / Fiscal Year
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const targetYear = body.targetYear || "FY 2026-27";
    const budgetText = body.budgetText || "";

    // Autonomous prompt for Gemini 3 Flash to synthesize statutory Indian Tax Rules
    const prompt = `You are the Chief Tax Economist & Autonomous Financial Rules Ingestion Engine for FinCoach AI.
Target Fiscal Year to formulate/calibrate: "${targetYear}".
${budgetText ? `Official Gazette Excerpt / Source Text:\n"""\n${budgetText}\n"""` : `Context: Autonomous forward-projection for the next Indian Union Budget. Calibrate progressive tax brackets for ${targetYear} building upon the Union Budget 2025 reforms (Section 115BAC indexation, competitive standard deduction of ₹1,00,000, Section 87A relief up to ₹7.5 Lakhs).`}

Return a STRICT, syntactically valid JSON object adhering EXACTLY to this TypeScript interface:

{
  "fiscalYear": "${targetYear}",
  "assessmentYear": "AY ${targetYear.replace("FY ", "").split("-")[0] ? Number(targetYear.replace("FY ", "").split("-")[0]) + 1 : 2027}-${targetYear.replace("FY ", "").split("-")[1] ? Number(targetYear.replace("FY ", "").split("-")[1]) + 1 : 28}",
  "budgetAnnouncement": "Union Budget ${targetYear.split("-")[0].replace("FY ", "")} Gazette (Autonomous AI Calibrated Rules)",
  "newRegime": {
    "standardDeduction": 100000,
    "rebate87ALimit": 750000,
    "slabs": [
      { "min": 0, "max": 400000, "rate": 0.0 },
      { "min": 400000, "max": 800000, "rate": 0.05 },
      { "min": 800000, "max": 1200000, "rate": 0.1 },
      { "min": 1200000, "max": 1600000, "rate": 0.15 },
      { "min": 1600000, "max": 2000000, "rate": 0.2 },
      { "min": 2000000, "max": null, "rate": 0.3 }
    ]
  },
  "oldRegime": {
    "standardDeduction": 50000,
    "rebate87ALimit": 500000,
    "slabs": [
      { "min": 0, "max": 250000, "rate": 0.0 },
      { "min": 250000, "max": 500000, "rate": 0.05 },
      { "min": 500000, "max": 1000000, "rate": 0.2 },
      { "min": 1000000, "max": null, "rate": 0.3 }
    ],
    "deductions": {
      "section80CMax": 150000,
      "section80DMaxSelf": 25000,
      "section80DMaxParents": 50000,
      "section80CCD1BMax": 50000,
      "section24BMax": 200000
    }
  },
  "healthAndEducationCess": 0.04
}

Rules:
1. ONLY return the raw JSON string. Do not include introductory prose, explanations, or unescaped characters.
2. Rates must be decimal numbers (0.05 for 5%, 0.1 for 10%, 0.3 for 30%).
3. The last slab in newRegime and oldRegime must have max: null.`;

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Clean markdown code blocks if present
    if (text.startsWith("```json")) {
      text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (text.startsWith("```")) {
      text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsedRule = JSON.parse(text) as FinancialYearTaxRules;

    if (!parsedRule.fiscalYear || !parsedRule.newRegime?.slabs || !Array.isArray(parsedRule.newRegime.slabs)) {
      return NextResponse.json(
        { error: "AI generated invalid rule schema" },
        { status: 500 }
      );
    }

    // Register dynamically in memory
    registerTaxRule(parsedRule);

    // Persist to Supabase if tax_rules table exists
    try {
      await supabase.from("tax_rules").upsert(
        {
          fiscal_year: parsedRule.fiscalYear,
          assessment_year: parsedRule.assessmentYear,
          budget_announcement: parsedRule.budgetAnnouncement,
          rules_json: parsedRule,
          source: "AI_AUTONOMOUS_INGESTION",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "fiscal_year" }
      );
    } catch {
      // Table doesn't exist or permissions restricted; in-memory registration already succeeded
    }

    return NextResponse.json({
      success: true,
      fiscalYear: parsedRule.fiscalYear,
      rule: parsedRule,
      availableYears: AVAILABLE_FISCAL_YEARS,
      message: `Autonomous AI successfully ingested & calibrated ${parsedRule.fiscalYear} tax rules!`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Autonomous sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
