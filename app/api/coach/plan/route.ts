import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePersonaCoachPlan } from "@/lib/coach-engine";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { persona } = await req.json();

    const { data: transactions } = await supabase
      .from("transactions")
      .select("id, description, amount, transaction_date, category_id, categories(name)")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .limit(100);

    const safeTransactions = (transactions || []).map((t) => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount),
      transaction_date: t.transaction_date,
      category_id: t.category_id,
      categories: Array.isArray(t.categories) ? t.categories[0] : t.categories,
    }));

    const plan = await generatePersonaCoachPlan(safeTransactions, persona || "shark");
    return NextResponse.json({ success: true, plan });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate coaching plan";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
