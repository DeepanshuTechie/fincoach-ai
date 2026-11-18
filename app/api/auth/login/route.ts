import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    let { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If unconfirmed, attempt automatic confirmation via service_role key if available
    if (error && error.message.toLowerCase().includes("email not confirmed")) {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        try {
          const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            serviceKey,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false,
              },
            }
          );

          const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
          const targetUser = usersData?.users.find(
            (u) => u.email?.toLowerCase().trim() === email.toLowerCase().trim()
          );

          if (targetUser) {
            await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
              email_confirm: true,
            });

            // Re-attempt sign in now that user is confirmed
            const retry = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (retry.data?.user) {
              return NextResponse.json({
                success: true,
                user: retry.data.user,
                autoConfirmed: true,
              });
            }
          }
        } catch (adminErr) {
          console.warn("Auto-confirmation via service role failed:", adminErr);
        }
      }

      return NextResponse.json(
        {
          error:
            "Aapka email verify nahi hua hai. Supabase Dashboard mein jakar Authentication > Providers > Email mein 'Confirm email' OFF karein.",
          isUnconfirmed: true,
        },
        { status: 400 }
      );
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
