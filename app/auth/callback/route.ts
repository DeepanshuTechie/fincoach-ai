import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("OAuth code exchange error:", error);
  }

  // If code exchange failed or no code present, redirect to login with error parameter
  return NextResponse.redirect(
    `${origin}/login?error=Google%20Authentication%20failed.%20Please%20ensure%20Google%20provider%20is%20enabled%20in%20Supabase.`
  );
}
