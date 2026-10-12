// Email a student about the latest thing staff did on their study application.
// Admin only. The text comes from the timeline event the database trigger just
// wrote, never from the request, so a caller cannot make us send arbitrary words.
// Respects the student's email notification preference. A failed send is logged
// and reported, and never blocks the staff action that triggered it.

import { NextResponse } from "next/server";
import { z } from "zod";

import { studyUpdate } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send.server";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  applicationId: z.string().uuid(),
  kind: z.enum(["stage", "document", "note", "system"]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { applicationId, kind } = parsed.data;

  const { data: app } = await supabase
    .from("study_applications")
    .select("id, user_id, reference, program_name, next_step, full_name")
    .eq("id", applicationId)
    .maybeSingle();
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const since = new Date(Date.now() - 10 * 60_000).toISOString();
  const { data: event } = await supabase
    .from("study_application_events")
    .select("title, body")
    .eq("application_id", applicationId)
    .eq("kind", kind)
    .eq("is_public", true)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!event) return NextResponse.json({ ok: true, skipped: "nothing new" });

  const { data: person } = await supabase.from("profiles").select("email, first_name, email_notifications").eq("id", app.user_id).maybeSingle();
  if (!person?.email || person.email_notifications === false) return NextResponse.json({ ok: true, skipped: "no email or opted out" });

  const sent = await sendEmail({
    to: person.email,
    template: "study_update",
    ...studyUpdate({
      name: person.first_name || app.full_name || "there",
      reference: app.reference,
      program: app.program_name || "your study application",
      title: event.title,
      detail: event.body,
      nextStep: kind === "stage" ? app.next_step : "",
      url: `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/auth/study/${app.id}`,
    }),
  });
  return NextResponse.json({ ok: sent });
}
