import { NextRequest, NextResponse } from "next/server";
import { categorizeTransactions } from "@/lib/categorize";

export async function POST(request: NextRequest) {
  const { transactions } = await request.json();

  if (!transactions || !Array.isArray(transactions)) {
    return NextResponse.json(
      { error: "Invalid transactions data" },
      { status: 400 }
    );
  }

  try {
    const categories = await categorizeTransactions(transactions);
    return NextResponse.json({ categories });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Categorization failed" },
      { status: 500 }
    );
  }
}