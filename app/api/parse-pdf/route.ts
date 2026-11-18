import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `You are a high-precision bank statement parser.
Extract all individual financial transactions from this bank statement document.
Return ONLY a valid JSON array of objects. Each object MUST have these exact properties:
- "description": The merchant name, payee, or narration (clean string, e.g. "Swiggy", "Netflix", "Uber Ride", "Electricity Bill")
- "amount": The transaction debit/expense amount as a positive number (e.g. 450.50). If it is a deposit/salary, still provide positive amount.
- "date": The transaction date in ISO format YYYY-MM-DD (e.g. "2026-07-02"). If the year is missing, assume current year.

Example format:
[
  { "description": "Swiggy Order", "amount": 420.00, "date": "2026-07-02" },
  { "description": "Uber Ride", "amount": 150.00, "date": "2026-07-06" }
]

Ignore account summary tables, opening/closing balance, addresses, and customer care notes. Return ONLY the JSON array.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data,
        },
      },
      prompt,
    ]);

    const text = result.response.text();
    const transactions = JSON.parse(text);

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: "No structured transactions could be detected in this PDF." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      transactions: transactions.map((t) => ({
        description: String(t.description || "Bank Transaction").trim(),
        amount: Math.abs(parseFloat(t.amount) || 0).toString(),
        date: String(t.date || new Date().toISOString().split("T")[0]).trim(),
      })),
    });
  } catch (err: unknown) {
    console.error("PDF statement parsing error:", err);
    const message = err instanceof Error ? err.message : "Failed to parse PDF statement";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
