import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { parseAnalyticsEvent } from "@/lib/validation/analytics";

// Events from anywhere but the production host (localhost, Vercel previews)
// are stored but flagged, so the analytics views leave them out.
const productionHost = new URL(env.NEXT_PUBLIC_SITE_URL).hostname.replace(/^www\./, "");

function isTestHost(host: string | null): boolean {
  if (!host) return true;
  return (host.split(":")[0] ?? "").replace(/^www\./, "") !== productionHost;
}

export async function POST(request: Request) {
  try {
    const event = parseAnalyticsEvent(await request.json());
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("analytics_user_activities").insert({
      action: event.action,
      page_visited: event.page,
      session_id: event.sessionId,
      user_id: auth.user?.id ?? null,
      user_agent: request.headers.get("user-agent") ?? "",
      is_test: isTestHost(request.headers.get("host")),
    });

    if (error) {
      return NextResponse.json(
        { error: { code: "ANALYTICS_WRITE_FAILED", message: "Unable to record this event." } },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: {} }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json(
        { error: { code: "INVALID_EVENT", message: "The event payload is invalid." } },
        { status: 400 },
      );
    }

    throw error;
  }
}
