// Imports the legacy Django users into Supabase Auth.
//
//   node scripts/import-legacy-users.mjs            dry run, writes nothing
//   node scripts/import-legacy-users.mjs --apply    creates the accounts
//
// What it does
// - Reads accounts_user out of the pg_dump custom-format archive (its data
//   blocks are zlib streams of COPY rows, so no pg_restore is needed).
// - Creates each user in Supabase Auth with email_confirm true and a random
//   password nobody knows. Django password hashes cannot be reused, so every
//   imported user signs in with "Forgot password" (or Google, if they used it).
// - The handle_new_user trigger creates the profile, the script then fills in
//   legacy_id, phone, bio, avatar, active flag and notification preferences.
// - Never grants admin. Staff and superuser flags are ignored on purpose, set
//   is_admin by hand in Supabase for anyone who should have it.
// - Skips an email that already exists, so it is safe to run twice.
//
// It prints counts only, never an email, name or password. The service role key
// is read from .env.local and is never printed.

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const APPLY = process.argv.includes('--apply');
const DUMP = process.argv.find((a) => a.endsWith('.sql') || a.endsWith('.dump')) ?? 'docs/old-database-to-transfer-to-supabase/techtour_db.sql';

// COPY column order of public.accounts_user, from extracted-schema.sql.
const COLUMNS = [
  'id', 'password', 'last_login', 'is_superuser', 'is_staff', 'is_active', 'date_joined', 'email', 'first_name',
  'last_name', 'phone_number', 'email_verified', 'phone_verified', 'two_factor_enabled', 'two_factor_secret',
  'two_factor_backup_codes', 'last_login_ip', 'login_attempts', 'locked_until', 'google_id', 'avatar_url',
  'created_at', 'updated_at', 'last_activity', 'preferred_language', 'timezone', 'email_notifications',
  'sms_notifications', 'marketing_emails', 'bio', 'profile_picture', 'text_size',
];

function loadEnv() {
  const env = {};
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

// COPY text format: tab separated, \N is null, backslash escapes.
function unescapeCopy(value) {
  if (value === '\\N') return null;
  return value.replace(/\\([\\tnrbfv])/g, (_, c) => ({ '\\': '\\', t: '\t', n: '\n', r: '\r', b: '\b', f: '\f', v: '\v' })[c]);
}

function findUserRows(buffer) {
  const rows = [];
  for (let i = 0; i < buffer.length - 1; i++) {
    // zlib streams begin 0x78 followed by 0x01, 0x5e, 0x9c or 0xda.
    if (buffer[i] !== 0x78 || ![0x01, 0x5e, 0x9c, 0xda].includes(buffer[i + 1])) continue;
    let text;
    try {
      text = inflateSync(buffer.subarray(i)).toString('utf8');
    } catch {
      try {
        // Trailing bytes after the stream make inflateSync throw, retry with a bounded slice.
        text = inflateSync(buffer.subarray(i, Math.min(buffer.length, i + 4_000_000)), { finishFlush: 2 }).toString('utf8');
      } catch {
        continue;
      }
    }
    // COPY data ends with a lone "\." line, keep only the real rows.
    const lines = text.split('\n').filter((l) => l.split('\t').length === COLUMNS.length);
    const looksLikeUsers = lines.length > 0 && lines.every((l) => /@/.test(l.split('\t')[7] ?? ''));
    if (!looksLikeUsers) continue;
    for (const line of lines) {
      const cells = line.split('\t').map(unescapeCopy);
      rows.push(Object.fromEntries(COLUMNS.map((c, k) => [c, cells[k]])));
    }
    break;
  }
  return rows;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const users = findUserRows(readFileSync(DUMP));
console.log(`Mode: ${APPLY ? 'APPLY (writes)' : 'DRY RUN (writes nothing)'}`);
console.log(`Legacy users found in the dump: ${users.length}`);
if (users.length === 0) process.exit(0);

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// Emails already in Supabase Auth, kept in memory only.
const existing = new Set();
for (let page = 1; ; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) {
    console.error('Could not list existing users:', error.message);
    process.exit(1);
  }
  data.users.forEach((u) => u.email && existing.add(u.email.toLowerCase()));
  if (data.users.length < 1000) break;
}

const tally = { created: 0, wouldCreate: 0, alreadyExists: 0, failed: 0, profileUpdateFailed: 0 };
for (const u of users) {
  const email = (u.email ?? '').trim().toLowerCase();
  if (!email) continue;
  if (existing.has(email)) {
    tally.alreadyExists++;
    continue;
  }
  if (!APPLY) {
    tally.wouldCreate++;
    continue;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: randomBytes(24).toString('base64url'),
    email_confirm: true,
    user_metadata: { first_name: u.first_name ?? '', last_name: u.last_name ?? '' },
  });
  if (error || !data.user) {
    tally.failed++;
    continue;
  }
  tally.created++;

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      legacy_id: Number(u.id),
      phone_number: u.phone_number,
      bio: u.bio,
      avatar_url: u.avatar_url || null,
      is_active: u.is_active === 't',
      email_notifications: u.email_notifications === 't',
      sms_notifications: u.sms_notifications === 't',
      marketing_emails: u.marketing_emails === 't',
    })
    .eq('id', data.user.id);
  if (profileError) tally.profileUpdateFailed++;
}

console.log('Result:', tally);
if (!APPLY) console.log('Nothing was written. Re-run with --apply to create the accounts.');
else console.log('Imported users have no usable password. They sign in with "Forgot password" (or Google).');
