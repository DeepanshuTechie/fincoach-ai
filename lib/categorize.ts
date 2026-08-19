import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

type TransactionInput = {
  description: string;
  amount: number;
};

const CATEGORIES = [
  "Food & Dining",
  "Rent & Housing",
  "Transportation",
  "Shopping",
  "Subscriptions",
  "Entertainment",
  "Utilities",
  "Income",
  "Other",
];

export async function categorizeTransactions(
  transactions: TransactionInput[]
): Promise<string[]> {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `You are a financial transaction categorizer. Given a list of transactions, assign each one to exactly one of these categories: ${CATEGORIES.join(", ")}.

Transactions:
${transactions
  .map((t, i) => `${i + 1}. "${t.description}" - amount: ${t.amount}`)
  .join("\n")}

Respond ONLY with a JSON array of category strings, in the same order as the transactions. Example: ["Food & Dining", "Income", "Shopping"]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const categories = JSON.parse(text) as string[];
    return categories;
  } catch {
    return transactions.map(() => "Other");
  }
}