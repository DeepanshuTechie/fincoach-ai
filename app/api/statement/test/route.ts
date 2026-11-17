import { NextResponse } from "next/server";
import { runUniversalParserTestSuite } from "@/lib/universal-parser/test-suite";

export async function GET() {
  const report = runUniversalParserTestSuite();
  return NextResponse.json(report);
}
