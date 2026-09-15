import { NextResponse } from "next/server";

// Polled by app/market/payment/verify/page.tsx after Paystack redirects the
// browser back. This is a convenience path for the UI to show a result
// immediately; the webhook (app/api/paystack/webhook/route.ts) is the
// authoritative settlement path and will reach the same state even if the
// visitor closes the tab before this ever runs. Both share
// lib/paystack-settle.server.ts so they cannot disagree.

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paystackVerify } from "@/lib/paystack.server";
import { settleSuccessfulTransaction, markFailedTransaction } from "@/lib/paystack-settle.server";

export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ status: false, message: "No payment reference found." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ status: false, message: "Please log in." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: transaction } = await admin
    .from("paystack_transactions")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();

  // Ownership check happens against our own record, not Paystack's, so a
  // signed in visitor cannot probe another user's reference for its status.
  if (!transaction || transaction.user_id !== user.id) {
    return NextResponse.json({ status: false, message: "Payment reference not found." }, { status: 404 });
  }

  if (transaction.status === "success") {
    return NextResponse.json({
      status: true,
      message: "Payment already verified.",
      data: toVerifyShape(transaction),
    });
  }

  if (transaction.status !== "pending") {
    return NextResponse.json({
      status: false,
      message: `Payment ${transaction.status}.`,
      data: toVerifyShape(transaction),
    });
  }

  const paystackResult = await paystackVerify(reference);

  if (paystackResult.data?.status === "success") {
    await settleSuccessfulTransaction(admin, transaction);
  } else {
    await markFailedTransaction(admin, reference);
  }

  const { data: settled } = await admin
    .from("paystack_transactions")
    .select("*")
    .eq("reference", reference)
    .single();

  return NextResponse.json({
    status: settled?.status === "success",
    message: paystackResult.message,
    data: toVerifyShape(settled ?? transaction),
  });
}

function toVerifyShape(transaction: {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  channel: string;
  metadata: unknown;
  email: string;
  created_at: string;
  paid_at: string | null;
}) {
  return {
    reference: transaction.reference,
    amount: transaction.amount,
    currency: transaction.currency,
    status: transaction.status,
    metadata: transaction.metadata,
    customer: { email: transaction.email },
    created_at: transaction.created_at,
    paid_at: transaction.paid_at ?? undefined,
    channel: transaction.channel ? [transaction.channel] : [],
  };
}
