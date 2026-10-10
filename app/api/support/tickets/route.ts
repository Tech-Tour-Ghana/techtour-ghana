// A signed-in customer opens a helpdesk ticket. The ticket and its first message
// are written by the create_support_ticket function (validation, ownership and
// rate limits live in the database), then a confirmation email goes out. Email
// failure never fails the request, the ticket is already saved.

import { NextResponse } from "next/server";

import { supportTicketCreated } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send.server";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, supportTicketSchema } from "@/lib/validation/forms";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to contact support." }, { status: 401 });

  const parsed = supportTicketSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  const t = parsed.data;

  const { data, error } = await supabase.rpc("create_support_ticket", {
    p_subject: t.subject, p_category: t.category, p_message: t.message, p_reference: t.reference,
  });
  if (error) {
    // 22023 bad input, 54000 rate limit: both messages are written for the customer.
    const friendly = error.code === "22023" || error.code === "54000";
    if (!friendly) console.error("create_support_ticket failed:", error);
    return NextResponse.json({ error: friendly ? error.message : "Could not open your ticket. Please try again." }, { status: friendly ? 429 : 500 });
  }
  const created = data as { id: string; ticket_number: string };

  const { data: profile } = await supabase.from("profiles").select("first_name").eq("id", user.id).maybeSingle();
  if (user.email) {
    await sendEmail({
      to: user.email,
      template: "support_ticket_created",
      ...supportTicketCreated({
        name: profile?.first_name || "there",
        number: created.ticket_number,
        subject: t.subject,
        url: `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/auth/support/${created.id}`,
      }),
    });
  }
  return NextResponse.json({ ok: true, id: created.id, ticket_number: created.ticket_number });
}
