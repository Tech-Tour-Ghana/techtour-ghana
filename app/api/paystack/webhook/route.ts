import { NextResponse } from "next/server";

// The authoritative payment settlement path. design.md B6: every call is
// logged before processing, so a crash mid processing still leaves the
// payload for a replay, and a bad signature is itself a logged finding
// rather than a silent drop.

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaystackSignature } from "@/lib/paystack.server";
import { settleSuccessfulTransaction, markFailedTransaction } from "@/lib/paystack-settle.server";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  const admin = createAdminClient();

  const valid = verifyPaystackSignature(rawBody, signature);

  let payload: { event?: string; data?: { reference?: string; status?: string } } = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    // Logged below with whatever reference an unparsable body cannot supply.
  }

  const { data: log } = await admin
    .from("paystack_webhook_logs")
    .insert({
      event_type: payload.event ?? "",
      reference: payload.data?.reference ?? "",
      payload,
      signature: signature ?? "",
      error_message: valid ? "" : "invalid signature",
    })
    .select("id")
    .single();

  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  try {
    const reference = payload.data?.reference;

    if (payload.event === "charge.success" && reference) {
      const { data: transaction } = await admin
        .from("paystack_transactions")
        .select("*")
        .eq("reference", reference)
        .maybeSingle();

      if (transaction) {
        await settleSuccessfulTransaction(admin, transaction);
      }
    } else if (payload.event === "charge.failed" && reference) {
      await markFailedTransaction(admin, reference);
    }

    if (log) {
      await admin
        .from("paystack_webhook_logs")
        .update({ is_processed: true })
        .eq("id", log.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    if (log) {
      await admin
        .from("paystack_webhook_logs")
        .update({ error_message: error instanceof Error ? error.message : "unknown error" })
        .eq("id", log.id);
    }
    // 500 tells Paystack to retry. The log row already has the payload, so
    // the retry re-runs a settlement that is idempotent either way.
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
