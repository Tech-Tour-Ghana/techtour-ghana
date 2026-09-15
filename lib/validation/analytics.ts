import { z } from "zod";

const analyticsEventSchema = z.object({
  action: z.literal("view"),
  page: z.string().startsWith("/").max(2_000),
  sessionId: z.string().min(1).max(255),
});

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

export function parseAnalyticsEvent(input: unknown): AnalyticsEvent {
  return analyticsEventSchema.parse(input);
}
