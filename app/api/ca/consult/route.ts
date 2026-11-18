import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { consultPersonalCA, generateFullCAAudit } from "@/lib/ca-engine";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { query, fiscalYear } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const { data: transactions } = await supabase
      .from("transactions")
      .select("id, description, amount, transaction_date, category_id, categories(name)")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .limit(150);

    const safeTransactions = (transactions || []).map((t) => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount),
      transaction_date: t.transaction_date,
      category_id: t.category_id,
      categories: Array.isArray(t.categories) ? t.categories[0] : t.categories,
    }));

    const response = await consultPersonalCA(safeTransactions, query, fiscalYear);
    return NextResponse.json({ success: true, response });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "CA consultation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fiscalYear = searchParams.get("fiscalYear") || undefined;

    const { data: transactions } = await supabase
      .from("transactions")
      .select("id, description, amount, transaction_date, category_id, categories(name)")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .limit(150);

    const safeTransactions = (transactions || []).map((t) => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount),
      transaction_date: t.transaction_date,
      category_id: t.category_id,
      categories: Array.isArray(t.categories) ? t.categories[0] : t.categories,
    }));

    const audit = generateFullCAAudit(safeTransactions, fiscalYear);
    return NextResponse.json({ success: true, audit });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch CA audit";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
