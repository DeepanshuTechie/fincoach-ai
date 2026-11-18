import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FullCAAuditReport } from "./ca-engine";
import { FinScoreResult } from "./coach-engine";

export function generateAndDownloadCAPdf(
  clientName: string = "DIPANSHU SHARMA",
  finScore: FinScoreResult,
  caAudit: FullCAAuditReport
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryColor = [23, 86, 36]; // #175624 Pine Green
  const goldColor = [164, 135, 62]; // #A4873E Antique Gold
  const charcoalColor = [51, 51, 51]; // #333333

  // ==========================================
  // HEADER & BRANDING
  // ==========================================
  doc.setFillColor(23, 86, 36);
  doc.rect(0, 0, 210, 28, "F");

  // Gold accent line
  doc.setFillColor(223, 185, 98);
  doc.rect(0, 28, 210, 2, "F");

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("FINCOACH AI  |  PERSONAL CA & WEALTH AUDIT", 14, 13);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("Autonomous Financial Health Diagnostic & Indian Tax Advisory Report", 14, 20);

  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  doc.setFont("helvetica", "bold");
  doc.text(`Tax Year: ${caAudit.taxAudit.fiscalYear}`, 150, 13);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${todayStr}`, 150, 20);

  // ==========================================
  // CLIENT & EXECUTIVE SUMMARY BLOCK
  // ==========================================
  let y = 38;

  doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("EXECUTIVE CLIENT DOSSIER", 14, y);

  y += 5;
  doc.setDrawColor(229, 230, 249);
  doc.setFillColor(248, 249, 253);
  doc.roundedRect(14, y, 182, 26, 3, 3, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Client Name:`, 18, y + 7);
  doc.setFont("helvetica", "normal");
  doc.text(clientName.toUpperCase(), 44, y + 7);

  doc.setFont("helvetica", "bold");
  doc.text(`FinScore Health:`, 105, y + 7);
  doc.setFont("helvetica", "normal");
  doc.text(`${finScore.score} / 1000 (Grade ${finScore.grade})`, 136, y + 7);

  doc.setFont("helvetica", "bold");
  doc.text(`Monthly Inflow:`, 18, y + 15);
  doc.setFont("helvetica", "normal");
  doc.text(`INR ${caAudit.foirAudit.monthlyInflow.toLocaleString("en-IN")}`, 44, y + 15);

  doc.setFont("helvetica", "bold");
  doc.text(`Debt Ratio (FOIR):`, 105, y + 15);
  doc.setFont("helvetica", "normal");
  doc.text(`${caAudit.foirAudit.foirPercent}% (${caAudit.foirAudit.status})`, 136, y + 15);

  doc.setFont("helvetica", "bold");
  doc.text(`Recommended Tax:`, 18, y + 22);
  doc.setFont("helvetica", "normal");
  doc.text(caAudit.taxAudit.recommendedRegime, 52, y + 22);

  doc.setFont("helvetica", "bold");
  doc.text(`Liquid Runway:`, 105, y + 22);
  doc.setFont("helvetica", "normal");
  doc.text(`${finScore.metrics.runwayDays} Days (Buffer: ${caAudit.emergencyFund.status})`, 136, y + 22);

  y += 34;

  // ==========================================
  // SECTION 1: INDIAN INCOME TAX & DEDUCTIONS AUDIT
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("1. INDIAN TAX DEDUCTIONS & REGIME ANALYSIS", 14, y);

  y += 3;

  autoTable(doc, {
    startY: y,
    head: [["Tax Provision", "Annual Limit", "Claimed / Detected", "Untapped Room", "Est. Tax Savings"]],
    body: [
      [
        "Section 80C (PPF, ELSS, EPF, LIC)",
        "INR 1,50,000",
        `INR ${caAudit.taxAudit.existingDeductions.section80C.toLocaleString("en-IN")}`,
        `INR ${caAudit.taxAudit.untappedDeductions.section80CRemaining.toLocaleString("en-IN")}`,
        `INR ${Math.round(caAudit.taxAudit.untappedDeductions.section80CRemaining * 0.208).toLocaleString("en-IN")}`,
      ],
      [
        "Section 80D (Health Insurance Mediclaim)",
        "INR 25,000",
        `INR ${caAudit.taxAudit.existingDeductions.section80D.toLocaleString("en-IN")}`,
        `INR ${caAudit.taxAudit.untappedDeductions.section80DRemaining.toLocaleString("en-IN")}`,
        `INR ${Math.round(caAudit.taxAudit.untappedDeductions.section80DRemaining * 0.208).toLocaleString("en-IN")}`,
      ],
      [
        "Section 80CCD(1B) (NPS Extra Exemption)",
        "INR 50,000",
        `INR ${caAudit.taxAudit.existingDeductions.section80CCD.toLocaleString("en-IN")}`,
        `INR ${caAudit.taxAudit.untappedDeductions.section80CCDRemaining.toLocaleString("en-IN")}`,
        `INR ${Math.round(caAudit.taxAudit.untappedDeductions.section80CCDRemaining * 0.208).toLocaleString("en-IN")}`,
      ],
      [
        "TOTAL TAX SAVING OPPORTUNITY",
        "INR 2,25,000+",
        "-",
        `INR ${caAudit.taxAudit.untappedDeductions.totalUntapped.toLocaleString("en-IN")}`,
        `INR ${caAudit.taxAudit.taxSavingsPotential.toLocaleString("en-IN")}`,
      ],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [23, 86, 36],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    footStyles: {
      fillColor: [248, 249, 253],
      fontStyle: "bold",
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  y = doc.lastAutoTable.finalY + 8;

  // ==========================================
  // SECTION 2: DEBT HEALTH & LIQUID EMERGENCY BUFFER
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("2. DEBT HEALTH (FOIR) & EMERGENCY RUNWAY AUDIT", 14, y);

  y += 3;

  autoTable(doc, {
    startY: y,
    head: [["Financial Diagnostic Metric", "User Figure", "Benchmark Standard", "CA Risk Evaluation"]],
    body: [
      [
        "Fixed Obligation Ratio (FOIR)",
        `${caAudit.foirAudit.foirPercent}% of Inflow`,
        "Less than 35% of Monthly Inflow",
        caAudit.foirAudit.status,
      ],
      [
        "Max Additional Safe EMI Capacity",
        `INR ${caAudit.foirAudit.maxSafeAdditionalEmi.toLocaleString("en-IN")}/mo`,
        "Capped at 40% Total FOIR",
        caAudit.foirAudit.maxSafeAdditionalEmi > 0 ? "Affordable Room Available" : "Overleveraged - Zero New EMIs",
      ],
      [
        "Emergency Reserve (6-Month Target)",
        `INR ${caAudit.emergencyFund.currentEstimatedBuffer.toLocaleString("en-IN")}`,
        `INR ${caAudit.emergencyFund.sixMonthTarget.toLocaleString("en-IN")} Target`,
        `${caAudit.emergencyFund.fundedPercentage}% Funded (${caAudit.emergencyFund.status})`,
      ],
      [
        "Daily Cash Burn Rate",
        `INR ${finScore.metrics.burnRatePerDay.toLocaleString("en-IN")}/day`,
        "Baseline Outflow Velocity",
        `${finScore.metrics.runwayDays} Days Zero-Income Survival`,
      ],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [164, 135, 62],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  y = doc.lastAutoTable.finalY + 8;

  // ==========================================
  // SECTION 3: ASSET ALLOCATION & COMPOUNDING HORIZON
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("3. STRATEGIC SURPLUS ALLOCATION & 5-YEAR WEALTH HORIZON", 14, y);

  y += 3;

  const allocationRows = caAudit.assetAllocation.recommendations.map((r) => [
    r.assetClass,
    `${r.percentage}%`,
    `INR ${r.amount.toLocaleString("en-IN")}/mo`,
    r.suggestedInstruments,
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Asset Class", "Weight", "Monthly SIP", "Suggested Instrument Benchmark"]],
    body: [
      ...allocationRows,
      [
        "TOTAL PROJECTED 5-YEAR WEALTH (12% CAGR)",
        "100%",
        `INR ${caAudit.assetAllocation.monthlyInvestibleSurplus.toLocaleString("en-IN")}/mo`,
        `INR ${(caAudit.assetAllocation.projectedFiveYearCorpus / 100000).toFixed(2)} LAKHS`,
      ],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [23, 86, 36],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  y = doc.lastAutoTable.finalY + 8;

  // ==========================================
  // SECTION 4: PRIORITY CA DIRECTIVES
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
  doc.text("PRIORITY CA DIRECTIVES FOR NEXT CYCLE:", 14, y);

  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  caAudit.caSummaryNotes.forEach((note) => {
    doc.text(`• ${note}`, 16, y);
    y += 4.5;
  });

  // ==========================================
  // FOOTER & REGULATORY DISCLAIMER
  // ==========================================
  y = Math.max(y + 2, 275);
  doc.setDrawColor(220, 220, 220);
  doc.line(14, y, 196, y);

  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text(
    "REGULATORY NOTICE: FinCoach AI provides algorithmic analytical insights based on user-provided bank statement data for self-planning and educational purposes.",
    14,
    y + 4
  );
  doc.text(
    "It is not an official statutory audit under the Chartered Accountants Act or registered investment advice under SEBI (IA) Regulations, 2013.",
    14,
    y + 7
  );
  doc.text(
    "Verified by FinCoach Autonomous Diagnostic Engine · Confidential Document",
    14,
    y + 10
  );

  doc.save(`FinCoach-CA-Audit-${clientName.replace(/\s+/g, "_")}.pdf`);
}
