/**
 * CONFIGURATION-DRIVEN TAX RULES REGISTRY
 * 
 * Supports versioned Union Budget fiscal years (FY 2024-25, FY 2025-26, FY 2026-27).
 * When the government updates tax slabs or limits in the annual Union Budget,
 * only this configuration registry is updated without modifying core business logic.
 */

export interface TaxSlab {
  min: number;
  max: number | null; // null for above limit
  rate: number; // e.g. 0.05 for 5%
}

export interface FinancialYearTaxRules {
  fiscalYear: string;
  assessmentYear: string;
  budgetAnnouncement: string;

  // New Tax Regime (Section 115BAC)
  newRegime: {
    standardDeduction: number;
    rebate87ALimit: number; // Total income up to which tax is NIL
    slabs: TaxSlab[];
  };

  // Old Tax Regime (With Chapter VI-A Deductions)
  oldRegime: {
    standardDeduction: number;
    rebate87ALimit: number;
    slabs: TaxSlab[];
    deductions: {
      section80CMax: number; // PPF, ELSS, EPF, LIC
      section80DMaxSelf: number; // Mediclaim self & family
      section80DMaxParents: number; // Mediclaim parents (senior citizen)
      section80CCD1BMax: number; // Additional NPS
      section24BMax: number; // Home loan interest deduction
    };
  };

  healthAndEducationCess: number; // Currently 4%
}

export const TAX_REGISTRY: Record<string, FinancialYearTaxRules> = {
  "FY 2025-26": {
    fiscalYear: "FY 2025-26",
    assessmentYear: "AY 2026-27",
    budgetAnnouncement: "Union Budget 2025 Standard (Sec 115BAC revised slabs + ₹75,000 standard deduction)",
    newRegime: {
      standardDeduction: 75000,
      rebate87ALimit: 700000,
      slabs: [
        { min: 0, max: 300000, rate: 0.0 },
        { min: 300000, max: 700000, rate: 0.05 },
        { min: 700000, max: 1000000, rate: 0.1 },
        { min: 1000000, max: 1200000, rate: 0.15 },
        { min: 1200000, max: 1500000, rate: 0.2 },
        { min: 1500000, max: null, rate: 0.3 },
      ],
    },
    oldRegime: {
      standardDeduction: 50000,
      rebate87ALimit: 500000,
      slabs: [
        { min: 0, max: 250000, rate: 0.0 },
        { min: 250000, max: 500000, rate: 0.05 },
        { min: 500000, max: 1000000, rate: 0.2 },
        { min: 1000000, max: null, rate: 0.3 },
      ],
      deductions: {
        section80CMax: 150000,
        section80DMaxSelf: 25000,
        section80DMaxParents: 50000,
        section80CCD1BMax: 50000,
        section24BMax: 200000,
      },
    },
    healthAndEducationCess: 0.04,
  },

  "FY 2024-25": {
    fiscalYear: "FY 2024-25",
    assessmentYear: "AY 2025-26",
    budgetAnnouncement: "Finance Act 2024 Baseline",
    newRegime: {
      standardDeduction: 50000,
      rebate87ALimit: 700000,
      slabs: [
        { min: 0, max: 300000, rate: 0.0 },
        { min: 300000, max: 600000, rate: 0.05 },
        { min: 600000, max: 900000, rate: 0.1 },
        { min: 900000, max: 1200000, rate: 0.15 },
        { min: 1200000, max: 1500000, rate: 0.2 },
        { min: 1500000, max: null, rate: 0.3 },
      ],
    },
    oldRegime: {
      standardDeduction: 50000,
      rebate87ALimit: 500000,
      slabs: [
        { min: 0, max: 250000, rate: 0.0 },
        { min: 250000, max: 500000, rate: 0.05 },
        { min: 500000, max: 1000000, rate: 0.2 },
        { min: 1000000, max: null, rate: 0.3 },
      ],
      deductions: {
        section80CMax: 150000,
        section80DMaxSelf: 25000,
        section80DMaxParents: 50000,
        section80CCD1BMax: 50000,
        section24BMax: 200000,
      },
    },
    healthAndEducationCess: 0.04,
  },
};

export const AVAILABLE_FISCAL_YEARS: string[] = Object.keys(TAX_REGISTRY);
export const DEFAULT_FISCAL_YEAR = "FY 2025-26";

/**
 * Dynamically registers a newly ingested or database-persisted fiscal year rule
 */
export function registerTaxRule(rule: FinancialYearTaxRules): void {
  TAX_REGISTRY[rule.fiscalYear] = rule;
  if (!AVAILABLE_FISCAL_YEARS.includes(rule.fiscalYear)) {
    AVAILABLE_FISCAL_YEARS.unshift(rule.fiscalYear);
  }
}

/**
 * Retrieves rule by fiscal year with graceful fallback
 */
export function getTaxRule(fiscalYear?: string): FinancialYearTaxRules {
  if (fiscalYear && TAX_REGISTRY[fiscalYear]) {
    return TAX_REGISTRY[fiscalYear];
  }
  return TAX_REGISTRY[DEFAULT_FISCAL_YEAR] || Object.values(TAX_REGISTRY)[0];
}

/**
 * Calculates raw tax on a given taxable income based on a set of slabs
 */
export function calculateTaxFromSlabs(taxableIncome: number, slabs: TaxSlab[]): number {
  if (taxableIncome <= 0) return 0;

  let totalTax = 0;
  for (const slab of slabs) {
    if (taxableIncome > slab.min) {
      const taxableAmountInSlab =
        slab.max !== null
          ? Math.min(taxableIncome, slab.max) - slab.min
          : taxableIncome - slab.min;

      if (taxableAmountInSlab > 0) {
        totalTax += taxableAmountInSlab * slab.rate;
      }
    }
  }

  return totalTax;
}
