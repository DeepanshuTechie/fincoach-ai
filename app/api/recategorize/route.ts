import { NextRequest, NextResponse } from "next/server";
import { categorizeWithHint } from "@/lib/categorize";

export async function POST(request: NextRequest) {
  const { description, amount, hint } = await request.json();

  if (!description || !hint) {
    return NextResponse.json(
      { error: "Description and hint are required" },
      { status: 400 }
    );
  }

  try {
    const category = await categorizeWithHint(description, amount, hint);
    return NextResponse.json({ category });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Recategorization failed" },
      { status: 500 }
    );
  }
}