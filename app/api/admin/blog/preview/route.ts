// Returns sanitised article HTML for the editor's Preview. Admin only. The
// article is never stored or published by this route.

import { NextResponse } from "next/server";

import { sanitizeArticleHtml } from "@/lib/seo/sanitize.server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { html?: unknown } | null;
  if (typeof body?.html !== "string" || body.html.length > 2_000_000) {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }
  return NextResponse.json({ html: sanitizeArticleHtml(body.html) }, { headers: { "Cache-Control": "no-store" } });
}
