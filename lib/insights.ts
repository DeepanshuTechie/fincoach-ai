import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ""
);

type Txn = {
  description: string;
  amount: number;
  categories: { name: string } | { name: string }[] | null;
};

// High-speed In-Memory Cache (5-minute TTL) to avoid repeat AI generation latency
const insightCache = new Map<string, { insight: string; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function generateMonthlyInsight(
  transactions: Txn[]
): Promise<string> {
  if (transactions.length === 0) {
    return "Upload a bank statement to get your first AI-powered spending insight.";
  }

  // Fast cache fingerprint from transactions
  const cacheKey = `insight_${transactions.length}_${transactions.slice(0, 3).map(t => `${t.description}_${t.amount}`).join("|")}`;
  const cached = insightCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.insight;
  }

  const getCatName = (t: Txn) => {
    if (!t.categories) return "Other";
    if (Array.isArray(t.categories)) return t.categories[0]?.name || "Other";
    return t.categories.name || "Other";
  };

  const expenses = transactions.filter((t) => getCatName(t) !== "Income");
  const totalSpent = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

  // Category-wise totals (plain math, no AI needed here)
  const categoryTotals = new Map<string, number>();
  expenses.forEach((t) => {
    const name = getCatName(t);
    categoryTotals.set(name, (categoryTotals.get(name) || 0) + Number(t.amount));
  });
  const sortedCategories = Array.from(categoryTotals.entries()).sort(
    (a, b) => b[1] - a[1]
  );
  const topCategory = sortedCategories[0];

  // Detect recurring merchants — same description appearing 2+ times
  const descCounts = new Map<string, { count: number; total: number }>();
  expenses.forEach((t) => {
    const existing = descCounts.get(t.description) || { count: 0, total: 0 };
    descCounts.set(t.description, {
      count: existing.count + 1,
      total: existing.total + Number(t.amount),
    });
  });
  const recurring = Array.from(descCounts.entries()).filter(
    ([, v]) => v.count >= 2
  );

  const facts = `
- Total spent: ₹${totalSpent}
- Top spending category: ${topCategory?.[0] || "N/A"} (₹${topCategory?.[1] || 0})
- Category breakdown: ${sortedCategories
    .map(([name, amt]) => `${name}: ₹${amt}`)
    .join(", ")}
- Recurring merchants: ${
    recurring.length > 0
      ? recurring
          .map(([desc, v]) => `${desc} (${v.count}x, total ₹${v.total})`)
          .join(", ")
      : "none detected"
  }
- Total transactions: ${expenses.length}
`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 250,
      },
    });

    const prompt = `You are a friendly personal finance coach. Based on these facts about a user's spending, write a short, warm 2-3 sentence summary. Be specific with numbers. If there's a recurring merchant or a dominant category, mention it and give one actionable tip.

Facts:
${facts}

Write only the summary paragraph — no headers, no bullet points, no markdown.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    if (text) {
      insightCache.set(cacheKey, { insight: text, timestamp: Date.now() });
      return text;
    }
  } catch (err) {
    console.warn("Gemini insight unavailable, generating analytical synthesis:", err);
  }

  const fallbackText = `In this billing cycle, you recorded ${expenses.length} outflow transactions totaling ₹${totalSpent}. Your largest allocation was ${topCategory?.[0] || "discretionary spending"} at ₹${topCategory?.[1] || 0}. ${
    recurring.length > 0
      ? `We detected ${recurring.length} recurring merchants including ${recurring[0][0]}.`
      : "No anomalous recurring merchant charges were detected."
  }`;
  insightCache.set(cacheKey, { insight: fallbackText, timestamp: Date.now() });
  return fallbackText;
}