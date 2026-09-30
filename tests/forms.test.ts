import assert from "node:assert/strict";
import test from "node:test";

import { contactAck, orderConfirmation } from "../lib/email/templates.ts";
import { contactSchema, fieldErrors, newsletterSchema } from "../lib/validation/forms.ts";

test("contact schema trims, defaults phone, and rejects bad input per field", () => {
  const ok = contactSchema.parse({ name: " Ama ", email: "a@b.co", subject: "Hi", message: "Hello" });
  assert.equal(ok.name, "Ama");
  assert.equal(ok.phone, "");

  const bad = contactSchema.safeParse({ name: "", email: "nope", subject: "", message: "" });
  assert.equal(bad.success, false);
  if (!bad.success) assert.deepEqual(Object.keys(fieldErrors(bad.error)).sort(), ["email", "message", "name", "subject"]);
});

test("newsletter schema rejects a malformed address", () => {
  assert.equal(newsletterSchema.safeParse({ email: "x" }).success, false);
  assert.equal(newsletterSchema.parse({ email: "x@y.co" }).source, "footer");
});

test("email templates escape user-controlled text", () => {
  assert.ok(!contactAck("<script>").html.includes("<script>"));
  assert.ok(orderConfirmation({ name: "A", reference: "R<1>", amount: 10, currency: "GHS" }).html.includes("GHS 10.00"));
});
