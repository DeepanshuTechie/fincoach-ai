import { NextRequest, NextResponse } from "next/server";
import { parseBankStatement } from "@/lib/universal-parser";

// Maximum upload limit: 15MB
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No statement file provided." }, { status: 400 });
    }

    // Size limit check (15MB)
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds maximum 15MB limit. Please upload a smaller statement." },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await parseBankStatement(buffer, file.name);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Failed to extract valid transactions from this statement.",
          details: result.validation.validation_issues,
          metadata: result.metadata,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("Universal Bank Statement Parser Error:", err);
    const msg = err instanceof Error ? err.message : "Internal statement processing error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
