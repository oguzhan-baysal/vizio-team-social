import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback handler.
 * Exchanges the authorization code for a session and redirects to dashboard.
 * This route is called by Supabase after a successful OAuth flow (e.g., Google).
 */
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
    }

    // If there's no code or an error occurred, redirect to login with error
    return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}
