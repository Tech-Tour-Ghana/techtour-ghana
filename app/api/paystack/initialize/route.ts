import { NextResponse } from "next/server";

// Starts a market checkout. Called by services/paystackService.ts on behalf
// of the ported PaystackPaymentModal, which sends { email, amount, currency,
// metadata: { items: [{ product_id, quantity }] }, callback_url }. The client
// supplied amount and price on each line are display values only: this route
// recomputes the true total from market_products before ever calling
// Paystack, per design.md B6.

import crypto from "node:crypto";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paystackInitialize } from "@/lib/paystack.server";
import { env } from "@/lib/env";

interface CheckoutLine {
  product_id: string;
  quantity: number;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const items: CheckoutLine[] = body?.metadata?.items ?? [];
  const phone: string = typeof body?.phone === "string" ? body.phone : "";

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { status: false, message: "Your cart is empty." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json(
      { status: false, message: "Please log in to check out." },
      { status: 401 },
    );
  }

  // The service role is needed from here on: pricing a cart reads
  // market_products, which is fine under the caller's own session, but
  // writing paystack_transactions requires it (design.md B6, 0013: owners
  // read, nobody but the server writes).
  const admin = createAdminClient();

  const productIds = items.map((item) => item.product_id).filter(Boolean);
  const { data: products, error: productsError } = await admin
    .from("market_products")
    .select("id, price, discount_price, is_active")
    .in("id", productIds);

  if (productsError) {
    return NextResponse.json({ status: false, message: "Could not price your cart." }, { status: 500 });
  }

  const productById = new Map((products ?? []).map((p) => [p.id, p]));
  let total = 0;
  const lineItems: CheckoutLine[] = [];

  for (const item of items) {
    const product = productById.get(item.product_id);
    const quantity = Number(item.quantity);

    if (!product || !product.is_active || !Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { status: false, message: "One or more items in your cart are no longer available." },
        { status: 400 },
      );
    }

    const unitPrice = product.discount_price ?? product.price;
    total += unitPrice * quantity;
    lineItems.push({ product_id: product.id, quantity });
  }

  // Minted here rather than left to Paystack, so it exists to look the
  // transaction up by before Paystack is ever called.
  const reference = crypto.randomUUID();

  const { data: transaction, error: insertError } = await admin
    .from("paystack_transactions")
    .insert({
      reference,
      amount: total,
      currency: "GHS",
      user_id: user.id,
      email: user.email,
      phone,
      // Cast through JSON round trip: lineItems is a plain {product_id, quantity}[]
      // and satisfies Json shape, but TS cannot see that through the interface.
      product_ids: JSON.parse(JSON.stringify(lineItems)),
      metadata: body?.metadata ?? {},
    })
    .select("id")
    .single();

  if (insertError || !transaction) {
    return NextResponse.json({ status: false, message: "Could not start checkout." }, { status: 500 });
  }

  const channels =
    body?.paymentMethod === "mobile_money" ? ["mobile_money"] : undefined;

  const result = await paystackInitialize({
    email: user.email,
    amountMinorUnits: Math.round(total * 100),
    reference,
    callback_url: `${env.NEXT_PUBLIC_SITE_URL}/market/payment/verify`,
    channels,
    metadata: body?.metadata ?? {},
  });

  if (!result.status || !result.data) {
    await admin
      .from("paystack_transactions")
      .update({ status: "failed" })
      .eq("id", transaction.id)
      .eq("status", "pending");

    return NextResponse.json(
      { status: false, message: result.message || "Payment initialization failed." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    status: true,
    message: result.message,
    data: {
      authorization_url: result.data.authorization_url,
      access_code: result.data.access_code,
      reference: result.data.reference,
    },
  });
}
