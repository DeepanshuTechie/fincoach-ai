import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
      return NextResponse.json(
        {
          error:
            "Service key not found in .env.local. Please confirm user directly in Supabase Dashboard > Authentication > Users > (three dots) > 'Confirm email'.",
          needsDashboardConfirm: true,
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // List users to find by email
    const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
    if (listErr || !usersData?.users) {
      return NextResponse.json({ error: listErr?.message || "Failed to find user" }, { status: 500 });
    }

    const targetUser = usersData.users.find(
      (u) => u.email?.toLowerCase().trim() === email.toLowerCase().trim()
    );

    if (!targetUser) {
      return NextResponse.json({ error: `User with email ${email} not found.` }, { status: 404 });
    }

    // Auto-confirm the user in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Email ${email} has been automatically confirmed! You can now log in immediately.`,
      user: data.user,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
