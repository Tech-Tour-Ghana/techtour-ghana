import { NextResponse } from "next/server";

// Landing spot for both Supabase flows that hand back a `code`: Google OAuth
// and email confirmation links (signup verification, password reset). Both
// need the code exchanged for a session before the browser is sent on to
// wherever it was headed.

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(`/auth/login?error=auth_failed`, url.origin));
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
