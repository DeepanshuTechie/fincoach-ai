import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { message, history } = await request.json();

  // User ki saari transactions fetch karo, category naam ke saath
  const { data: transactions } = await supabase
    .from("transactions")
    .select("description, amount, transaction_date, categories(name)")
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false })
    .limit(200);

  const transactionSummary = (transactions || [])
    .map((t) => {
      const cat = Array.isArray(t.categories) ? t.categories[0] : t.categories;
      const catName = (cat as { name?: string } | null)?.name || "Uncategorized";
      return `${t.transaction_date} | ${t.description} | ₹${t.amount} | ${catName}`;
    })
    .join("\n");

  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const systemContext = `You are a helpful personal finance assistant. You have access to the user's real transaction history below. Answer their questions using ONLY this data. Be specific with numbers (use ₹ for amounts). If the data doesn't have enough information to answer, say so honestly instead of guessing.

Transaction history (date | description | amount | category):
${transactionSummary}`;

  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: systemContext }] },
      {
        role: "model",
        parts: [
          {
            text: "Understood. I'll answer questions about your finances using this transaction data.",
          },
        ],
      },
      ...(history || []).map((h: { role: string; text: string }) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }],
      })),
    ],
  });

  try {
    const result = await chat.sendMessage(message);
    const reply = result.response.text();
    return NextResponse.json({ reply });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}