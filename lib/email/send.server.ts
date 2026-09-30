import "server-only";

// Thin Resend client over its REST API, no SDK. A failed send is logged and
// reported as false, never thrown: an email is a side effect of a submission
// or a payment that has already been recorded, and must not turn that into
// an error for the visitor.

import { getServerEnv } from "@/lib/env.server";

const FROM = "TechTour Ghana <noreply@techtourghana.com>";

export async function sendEmail(input: { to: string; subject: string; html: string; replyTo?: string }): Promise<boolean> {
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
      console.error("Resend rejected email:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Resend request failed:", error);
    return false;
  }
}
