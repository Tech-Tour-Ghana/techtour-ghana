import "server-only";

// Server-side Paystack API client. The secret key never leaves this module.
// design.md B6: amounts are always recomputed server side and sent to
// Paystack in minor units (pesewas), never trusted from the browser.

import crypto from "node:crypto";

import { getServerEnv } from "@/lib/env.server";

const PAYSTACK_API = "https://api.paystack.co";

function authHeader() {
  return `Bearer ${getServerEnv().PAYSTACK_SECRET_KEY}`;
}

export interface PaystackInitializeResult {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export async function paystackInitialize(params: {
  email: string;
  amountMinorUnits: number;
  reference: string;
  callback_url: string;
  currency?: string;
  channels?: string[];
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitializeResult> {
  const response = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountMinorUnits,
      reference: params.reference,
      callback_url: params.callback_url,
      currency: params.currency ?? "GHS",
      channels: params.channels,
      metadata: params.metadata,
    }),
  });

  return (await response.json()) as PaystackInitializeResult;
}

export interface PaystackVerifyResult {
  status: boolean;
  message: string;
  data?: {
    reference: string;
    status: "success" | "failed" | "abandoned" | "pending" | "ongoing" | "processing";
    amount: number;
    currency: string;
    channel: string;
    authorization?: { authorization_code?: string; card_type?: string; bank?: string; last4?: string };
    paid_at?: string | null;
  };
}

export async function paystackVerify(reference: string): Promise<PaystackVerifyResult> {
  const response = await fetch(
    `${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: authHeader() } },
  );

  return (await response.json()) as PaystackVerifyResult;
}

/**
 * Verifies the x-paystack-signature header. Paystack signs the raw request
 * body with HMAC SHA512 using the secret key. Must run on the raw text, not
 * on a re-serialised JSON.parse(body), which is not guaranteed to produce
 * byte-identical output.
 */
export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha512", getServerEnv().PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== signatureBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}
