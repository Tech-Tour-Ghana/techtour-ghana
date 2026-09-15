import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createClient } from "@/lib/supabase/server";
import { parseAnalyticsEvent } from "@/lib/validation/analytics";

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
