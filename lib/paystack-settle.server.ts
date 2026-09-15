import "server-only";

// Shared settlement logic for the verify Route Handler and the webhook Route
// Handler. Both learn about a successful charge through a different door
// (one polled by the browser, one pushed by Paystack) and both must produce
// exactly the same result: the transaction marked success, and one order row
// per cart line. Duplicated logic between them is how the two paths drift and
// one of them stops creating orders.
//
// Runs with the service role, the one caller class lib/supabase/admin.ts
// documents: orders_insert is admin only (design.md B6, 0013), and neither
// the webhook nor the person polling verify is signed in as an admin.

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Transaction = Database["public"]["Tables"]["paystack_transactions"]["Row"];

interface CartLineMetadata {
  product_id?: string;
  quantity?: number;
}

/**
 * Marks a pending transaction settled and creates its orders, or reports
 * what the transaction already is if this has already happened. Safe to call
 * twice for the same reference: the status update only touches a row still
 * pending (design.md B6's update-where-pending pattern), and the unique
 * index from 0015 on (paystack_transaction_id, product_id) rejects a second
 * order for a line that already has one.
 */
export async function settleSuccessfulTransaction(
  admin: SupabaseClient<Database>,
  transaction: Transaction,
): Promise<{ settled: boolean }> {
  const { data: updated, error: updateError } = await admin
    .from("paystack_transactions")
    .update({ status: "success" })
    .eq("reference", transaction.reference)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError) throw updateError;

  // Zero rows updated means this reference already settled (or already
  // failed) on an earlier call. Nothing left to do, and that is success, not
  // an error: design.md B6 requires exactly this to be a silent no-op.
  if (!updated) return { settled: false };

  const items = Array.isArray(transaction.product_ids)
    ? (transaction.product_ids as unknown as CartLineMetadata[])
    : [];

  for (const item of items) {
    if (!item.product_id || !item.quantity || item.quantity <= 0) continue;

    const { data: product, error: productError } = await admin
      .from("market_products")
      .select("id, price, discount_price")
      .eq("id", item.product_id)
      .maybeSingle();

    if (productError) throw productError;
    if (!product) continue; // Product removed between checkout and settlement.

    const unitPrice = product.discount_price ?? product.price;

    const { error: orderError } = await admin.from("orders").insert({
      user_id: transaction.user_id!,
      product_id: product.id,
      quantity: item.quantity,
      unit_price: unitPrice,
      total_price: unitPrice * item.quantity,
      currency: transaction.currency,
      phone_number: transaction.phone,
      payment_status: "success",
      paystack_transaction_id: transaction.id,
    });

    // 23505 is the unique_violation this line's own retry would produce.
    // Every other error is real and must surface.
    if (orderError && orderError.code !== "23505") throw orderError;
  }

  return { settled: true };
}

export async function markFailedTransaction(
  admin: SupabaseClient<Database>,
  reference: string,
): Promise<void> {
  const { error } = await admin
    .from("paystack_transactions")
    .update({ status: "failed" })
    .eq("reference", reference)
    .eq("status", "pending");

  if (error) throw error;
}
