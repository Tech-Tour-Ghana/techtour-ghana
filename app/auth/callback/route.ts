import { NextResponse } from "next/server";

// Landing spot for both Supabase flows that hand back a `code`: Google OAuth
// and email confirmation links (signup verification, password reset). Both
// need the code exchanged for a session before the browser is sent on to
// wherever it was headed.

import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/utils/safe-next";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const failure = next.startsWith("/auth/confirm-email") ? "/auth/confirm-email?error=1" : "/auth/login?error=auth_failed";
      return NextResponse.redirect(new URL(failure, url.origin));
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
