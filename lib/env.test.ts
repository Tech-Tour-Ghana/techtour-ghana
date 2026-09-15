// Self-check for lib/env.ts. Run with: node lib/env.test.ts
// Verifies: (1) valid vars parse and getServerEnv() returns them server side,
// (2) getServerEnv() throws when a browser context is faked,
// (3) a missing/malformed var produces an error naming every offending
//     variable, not just the first one.
// No test framework: this is branching logic that fails silently if broken,
// so it gets one runnable check, nothing more.

import assert from "node:assert/strict";

const REQUIRED = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  PAYSTACK_SECRET_KEY: "sk_test_key",
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: "pk_test_key",
  RESEND_API_KEY: "re_key",
  NEXT_PUBLIC_SITE_URL: "https://example.com",
};

function setEnv(vars: Record<string, string | undefined>): void {
  for (const key of Object.keys(REQUIRED)) {
    const value = vars[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

async function loadFresh() {
  const url = `./env.ts?t=${Date.now()}-${Math.random()}`;
  return import(url);
}

async function main() {
  // 1. Valid config parses and getServerEnv() works server side.
  setEnv(REQUIRED);
  const good = await loadFresh();
  assert.equal(good.env.NEXT_PUBLIC_SUPABASE_URL, REQUIRED.NEXT_PUBLIC_SUPABASE_URL);
  assert.equal(good.getServerEnv().SUPABASE_SERVICE_ROLE_KEY, REQUIRED.SUPABASE_SERVICE_ROLE_KEY);

  // 2. getServerEnv() throws when called in a faked browser context.
  (globalThis as { window?: unknown }).window = {};
  try {
    assert.throws(() => good.getServerEnv(), /browser context/);
  } finally {
    delete (globalThis as { window?: unknown }).window;
  }

  // 3. Missing/malformed vars are all named in one error, not just the first.
  setEnv({
    ...REQUIRED,
    NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
    SUPABASE_SERVICE_ROLE_KEY: undefined,
    RESEND_API_KEY: undefined,
  });
  await assert.rejects(
    loadFresh(),
    (error: Error) => {
      assert.match(error.message, /NEXT_PUBLIC_SUPABASE_URL/);
      assert.match(error.message, /SUPABASE_SERVICE_ROLE_KEY/);
      assert.match(error.message, /RESEND_API_KEY/);
      return true;
    },
  );

  console.log("lib/env.ts self-check passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
