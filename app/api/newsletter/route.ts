// Newsletter signup. Stored through the visitor's RLS-checked client, welcome
// email sent only for a new address (a duplicate is 409 and sends nothing).

import { NextResponse } from "next/server";

import { newsletterWelcome } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send.server";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, newsletterSchema } from "@/lib/validation/forms";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }
  const { email, source } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_subscribers").insert({ email, source });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "This email is already subscribed." }, { status: 409 });
    }
    console.error("newsletter_subscribers insert failed:", error);
    return NextResponse.json({ error: "Subscription failed." }, { status: 500 });
  }

  await sendEmail({ to: email, template: 'newsletter_welcome', ...newsletterWelcome() });
  return NextResponse.json({ ok: true });
}
