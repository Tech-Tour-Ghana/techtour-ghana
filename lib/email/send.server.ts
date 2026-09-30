import "server-only";

// Thin Resend client over its REST API, no SDK. A failed send is logged and
// reported as false, never thrown: an email is a side effect of a submission
// or a payment that has already been recorded, and must not turn that into
// an error for the visitor.
//
// Every attempt is also written to public.email_log, so staff can see what was
// sent and what failed in /admin/emails. That write is best effort and uses the
// service role (email_log has no client write policy), a second legitimate
// caller of lib/supabase/admin.ts alongside the payment routes.

import { getServerEnv } from "@/lib/env.server";
import { createAdminClient } from "@/lib/supabase/admin";

const FROM = "TechTour Ghana <noreply@techtourghana.com>";

export interface EmailInput {
  to: string;
  subject: string;
  html: string;
  /** Template name recorded in the email log, for example "order_confirmation". */
  template: string;
  replyTo?: string;
}

async function record(input: EmailInput, status: "sent" | "failed", errorMessage: string) {
  try {
    await createAdminClient()
      .from("email_log")
      .insert({
        template_name: input.template,
        recipient: input.to,
        subject: input.subject,
        content: input.html,
        status,
        error_message: errorMessage.slice(0, 500),
        sent_at: status === "sent" ? new Date().toISOString() : null,
      });
  } catch (error) {
    console.error("Could not write email_log:", error);
  }
}

export async function sendEmail(input: EmailInput): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getServerEnv().RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
        reply_to: input.replyTo,
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error("Resend rejected email:", res.status, detail);
      await record(input, "failed", `Resend ${res.status}: ${detail}`);
      return false;
    }
    await record(input, "sent", "");
    return true;
  } catch (error) {
    console.error("Resend request failed:", error);
    await record(input, "failed", error instanceof Error ? error.message : "Request failed");
    return false;
  }
}
