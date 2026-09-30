// Contact form submission. Validated with the shared schema, stored through
// the visitor's own RLS-checked client (contact_messages_insert_public), then
// emailed. Email failure never fails the request, the message is already saved.

import { NextResponse } from "next/server";

import { contactAck, contactNotify } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send.server";
import { getServerEnv } from "@/lib/env.server";
import { createClient } from "@/lib/supabase/server";
import { contactSchema, fieldErrors } from "@/lib/validation/forms";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }
  const message = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert(message);
  if (error) {
    console.error("contact_messages insert failed:", error);
    return NextResponse.json({ error: "Could not send your message." }, { status: 500 });
  }

  const ack = contactAck(message.name);
  const notifyTo = getServerEnv().CONTACT_NOTIFY_EMAIL;
  await Promise.all([
    sendEmail({ to: message.email, ...ack }),
    notifyTo ? sendEmail({ to: notifyTo, replyTo: message.email, ...contactNotify(message) }) : undefined,
  ]);

  return NextResponse.json({ ok: true });
}
