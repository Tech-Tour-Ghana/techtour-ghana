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

export const SUPPORT_CATEGORIES = ["booking", "payment", "order", "study", "account", "technical", "other"] as const;

export const supportTicketSchema = z.object({
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(140),
  category: z.enum(SUPPORT_CATEGORIES).default("other"),
  message: z.string().trim().min(10, "Tell us a little more, at least 10 characters").max(5_000),
  reference: z.string().trim().max(80).default(""),
});

export const adminReplySchema = z.object({
  ticketId: z.uuid(),
  body: z.string().trim().min(1, "Write a reply").max(5_000),
  internal: z.boolean().default(false),
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
