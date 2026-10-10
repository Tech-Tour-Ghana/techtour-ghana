// Staff reply or internal note on a ticket. Admin only. The message is written
// through the admin's own RLS-checked client (support_messages_insert_admin); the
// database trigger moves the ticket along and notifies the customer in-app. A
// public reply is also emailed. Email failure never fails the request.

import { NextResponse } from "next/server";

import { supportReply } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send.server";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { adminReplySchema, fieldErrors } from "@/lib/validation/forms";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = adminReplySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  const { ticketId, body, internal } = parsed.data;

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, ticket_number, subject, profiles!support_tickets_user_id_fkey(first_name, email)")
    .eq("id", ticketId)
    .maybeSingle();
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const { error } = await supabase.from("support_messages").insert({ ticket_id: ticketId, author_id: user.id, is_staff: true, is_internal: internal, body });
  if (error) {
    console.error("support_messages insert failed:", error);
    return NextResponse.json({ error: "Could not send the reply." }, { status: 500 });
  }

  const customer = ticket.profiles;
  if (!internal && customer?.email) {
    await sendEmail({
      to: customer.email,
      template: "support_reply",
      ...supportReply({
        name: customer.first_name || "there",
        number: ticket.ticket_number,
        subject: ticket.subject,
        snippet: body.slice(0, 600),
        url: `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/auth/support/${ticket.id}`,
      }),
    });
  }
  return NextResponse.json({ ok: true });
}
