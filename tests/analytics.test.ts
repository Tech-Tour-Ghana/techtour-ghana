import assert from "node:assert/strict";
import test from "node:test";

import { parseAnalyticsEvent } from "../lib/validation/analytics.ts";

test("accepts a page-view event", () => {
  const event = parseAnalyticsEvent({
    action: "view",
    page: "/market?category=tech",
    sessionId: "session_123",
  });

  assert.deepEqual(event, {
    action: "view",
    page: "/market?category=tech",
    sessionId: "session_123",
  });
});

test("rejects an event without a page", () => {
  assert.throws(
    () => parseAnalyticsEvent({ action: "view", sessionId: "session_123" }),
    /page/,
  );
});

test("rejects financial event types from the browser", () => {
  assert.throws(
    () =>
      parseAnalyticsEvent({
        action: "purchase",
        page: "/market",
        sessionId: "session_123",
      }),
    /action/,
  );
});
