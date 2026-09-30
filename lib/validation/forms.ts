import { z } from "zod";

// Field limits mirror what the forms already collect. phone is optional and
// stored as '' when blank (contact_messages.phone is NOT NULL default '').
export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.email("Enter a valid email address").max(320),
  phone: z.string().trim().max(50).default(""),
  subject: z.string().trim().min(1, "Subject is required").max(300),
  message: z.string().trim().min(1, "Message is required").max(5_000),
});

export const newsletterSchema = z.object({
  email: z.email("Enter a valid email address").max(320),
  source: z.literal("footer").default("footer"),
});

/** First field-level message per field, for the API error body. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
