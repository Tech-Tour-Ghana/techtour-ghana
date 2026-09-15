# TechTour Ghana, Architecture

## 1. Purpose

TechTour Ghana is a multi-service platform covering tourism, an online market,
study-abroad services, and tech ecosystem content. This document defines the
target architecture for the consolidated rebuild.

The rebuild has one driving goal: collapse two stacks into one, hosted on a
single platform, with a single database.

## 2. Current state, and why it changes

The system today is split across two repositories and two runtimes.

| Concern | Today | Problem |
| --- | --- | --- |
| Frontend | Next.js 14, App Router, TypeScript, Tailwind | Fine, it stays |
| Backend | Django 5 with Django REST Framework | Second language, second runtime, second deploy target |
| Database | PostgreSQL on Render, with MongoDB drivers also installed | Split-brain risk, unclear source of truth |
| Auth | django-allauth plus SimpleJWT plus django-otp, tokens in localStorage | Three overlapping systems, tokens exposed to XSS |
| Hosting | Render for the API, separate host for the frontend | Two pipelines, cross-origin complexity |
| Media | Django ImageField on local disk, served by WhiteNoise | Ephemeral filesystem, uploads do not survive redeploys |

Two defects are inherited and must not be carried forward.

- Route protection is broken. `proxy.ts` checks for a `sessionid` cookie, but
  the app stores its token in `localStorage` and never sets that cookie. Every
  protected route is therefore treated as unauthenticated.
- The Tailwind config declares `primary: #2563eb` and `secondary: #7c3aed`.
  Neither colour appears anywhere in the interface. The real brand colours are
  hardcoded across roughly 4,700 lines of CSS. See `design.md`.

## 3. Target stack

One application. One repository. One deploy.

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 15, App Router | Server Components by default, Route Handlers for the API surface |
| Language | TypeScript, strict mode | Single language across client and server |
| Styling | Tailwind CSS with CSS custom properties | Tokens defined once, see `design.md` |
| Database | Supabase Postgres | Direct successor to the Render Postgres instance |
| Data access | `supabase-js` | No ORM, queries go through the Supabase client |
| Schema | Plain SQL migrations under `supabase/migrations/` | Version controlled and reviewable, applied with the Supabase CLI |
| Auth | Supabase Auth | Email and password, Google OAuth, email verification, password reset, MFA |
| File storage | Supabase Storage | Replaces Django media handling |
| Payments | Paystack, server-side | Initialise and verify in Route Handlers, plus a signed webhook |
| Email | Resend | Replaces SendGrid |
| Validation | Zod | Every request body and every environment variable |
| Hosting | Vercel | Git push triggers the deploy |
| DNS | Cloudflare | Delegated to Vercel, proxy disabled on the apex and `www` |

### Why no ORM

Queries run through `supabase-js`. Schema still lives in the repository as
plain SQL migration files, applied with the Supabase CLI. This keeps the
database reviewable in pull requests without adding an ORM layer, and it keeps
row level security policies next to the tables they protect.

### Why the backend disappears

There is no separate backend service. Server-side work runs as Route Handlers
and Server Actions inside the same Next.js application. Reads that do not need
a client round trip happen directly in Server Components.

This removes the cross-origin problem, the second deploy pipeline, and the
token-refresh logic in `lib/api.ts` entirely.

## 4. Repository layout

```
app/
  (site)/              Public pages: home, tours, market, study, about, contact
  (auth)/              Sign in, sign up, password reset, email confirmation
  (account)/           Authenticated: dashboard, profile, orders, bookings
  api/
    paystack/          Payment initialise, verify, webhook
    webhooks/          Third-party inbound
  layout.tsx
  globals.css
components/
  ui/                  Primitives: button, input, card, badge, modal
  layout/              Navbar, footer, sidebar
  features/            Domain components, grouped by service area
lib/
  supabase/            Browser, server, and admin clients
  paystack/            Client and signature verification
  email/               Resend client and templates
  validation/          Zod schemas
  utils/
supabase/
  migrations/          Numbered SQL migration files
  seed.sql
types/
  database.ts          Generated from the live schema
middleware.ts          Session refresh and route protection
```

## 5. Data model

The dump in `docs/old-database-to-transfer-to-supabase/` contains 85 tables,
85 primary keys, 37 unique constraints, 59 foreign keys, and 106 indexes.
Roughly half the tables are framework plumbing and are not migrated.

The archive is a `pg_dump` custom format file. Its table of contents stores
all DDL as readable text, which is recoverable without `pg_restore` and has
been extracted to `extracted-schema.sql` beside it. The row data is
compressed and is not recoverable without `pg_restore`.

Note that the Django foreign keys carry almost no delete behaviour at the
database level. Only 4 of the 59 declare `ON DELETE`, because Django enforced
those rules in Python instead. The new schema therefore chooses delete
behaviour deliberately rather than inheriting it.

### Discarded

Django and library internals with no business meaning:
`django_migrations`, `django_session`, `django_admin_log`, `django_content_type`,
`django_site`, `auth_group`, `auth_permission`, `auth_group_permissions`,
`accounts_user_groups`, `accounts_user_user_permissions`,
`account_emailaddress`, `account_emailconfirmation`, `socialaccount_*`,
`otp_static_*`, `otp_totp_*`.

The auth behaviour these tables encoded is provided by Supabase Auth instead.

### Migrated

Grouped by domain.

**Identity.** `accounts_user` becomes a `profiles` table keyed to
`auth.users.id`. Credentials, verification state, lockout counters, and MFA
secrets move into Supabase Auth and are dropped from the application table.
`accounts_login_history` and `accounts_user_session` are retained for audit.
`accounts_email_verification` and `accounts_otp_code` are dropped.

**Tours.** `tours_tour`, `tours_tourcategory`, `tours_tourschedule`,
`tours_tourreview`, `tours_booking`.

**Market.** `pages_marketproduct`, `pages_marketcategory`,
`pages_productgallery`, `pages_order`, `pages_shippingsettings`.

**Artisans.** `pages_artisan`, `pages_artisanproduct`.

**Study abroad.** `pages_studydestination`, `pages_scholarship`.

**Vacations.** `pages_vacationrental`, `pages_vacationbooking`.

**Tech ecosystem.** `pages_techinnovation`, `pages_techevent`,
`pages_techresource`.

**Site content, editor managed.** `pages_sitesettings`, `pages_navbarmenu`,
`pages_navbardropdown`, `pages_homepageslide`, `pages_homepagesection`,
`pages_mainfeaturecard`, `pages_smallglasscard`, `pages_videosection`,
`pages_testimonial`, `pages_teammember`, `pages_footersettings`,
`pages_footerfeature`, `pages_footerquicklink`, `pages_footercontact`,
`pages_sociallink`, `pages_legallink`.

**Careers.** `pages_jobopening`, `pages_jobcategory`.

**Inbound messages.** `pages_contactmessage`, `pages_newslettersubscriber`,
`pages_suggestion`, `pages_reportissue`.

**Payments.** `paystack_paystacktransaction`, `paystack_paystackwebhooklog`.

**Analytics.** `analytics_useractivity`, `analytics_usersession`,
`analytics_userlike`, `analytics_socialshare`, `analytics_tourbooking`,
`analytics_marketpurchase`, `analytics_contactsubmission`,
`analytics_useranalytics`.

### Deferred to phase 6, with the admin dashboard

These exist in the dump and are neither discarded nor migrated in phase 1.
They configure or record staff tooling, which does not ship until the admin
dashboard is rebuilt. They stay in the archive until then.

`admin_dashboard_companysettings`, `admin_dashboard_sidebarsection`,
`admin_dashboard_sidebaritem`, `admin_dashboard_frontendsidebaritem`,
`accounts_admin_notification`, `pages_adminactivitylog`.

### Email templating, superseded

`pages_emailtemplate`, `pages_emailtemplate_default_attachments`,
`pages_emailattachment`, and `analytics_emailtemplate` stored email bodies and
attachments for the SendGrid integration. Resend owns templates now, so the
content does not migrate. Template copy should be read out of the archive
before it is retired, since it is the only record of the wording.

`pages_emaillog` and `analytics_emaillog` are delivery logs. They migrate as a
single `email_log` table, because a record of what was sent to whom is worth
keeping across the transition.

### Conventions

- Table names are lower snake case, without the Django app prefix.
  `pages_marketproduct` becomes `market_products`.
- Primary keys are `uuid` with a `gen_random_uuid()` default. Integer keys from
  the dump are preserved in a `legacy_id` column during migration so foreign
  keys can be rebuilt, then that column is dropped.
- Every table carries `created_at` and `updated_at` as `timestamptz`.
- Money is `numeric(10,2)`. Currency is an explicit column, defaulting to `GHS`.
- Soft delete uses an `is_active` boolean, matching existing behaviour.

## 6. Security

### Row level security

RLS is enabled on every table. There is no exception.

- Public content tables, meaning tours, products, destinations, and all site
  content, allow anonymous `SELECT` where `is_active` is true.
- User owned rows are readable by their owner, matched on `auth.uid()`. A
  profile is also updatable by its owner, with `is_admin` pinned so a user
  cannot grant themselves admin.
- **Financial records are never written by a client**, owner included.
  Bookings, orders, vacation bookings and Paystack transactions are created by
  server code that recomputes the price from the database, per `design.md` B6.
  A client insert policy would let a browser choose its own total. Cancellation
  runs server side too, because it releases schedule spots and may need a
  refund, which a bare row update cannot do.
- Writes to content tables require an admin claim.
- Inbound message tables, such as the contact form and newsletter, accept
  inserts from anyone and are readable only by admins, with staff workflow
  columns pinned on insert.
- Behavioural analytics tables accept inserts from anyone, with `user_id`
  forced to null or the caller's own id. Analytics tables that carry money or
  personal data do not, and neither does the daily rollup, because a client
  could otherwise inflate revenue figures. All client analytics is untrusted
  telemetry: RLS cannot rate limit, and timestamps and actions are whatever
  the client sent.

### Column privileges

**RLS is row level, not column level.** A policy that lets a role read a row
exposes every column of it. To hide a column, revoke table level `SELECT` from
`anon` and `authenticated`, then grant `SELECT` back by name on the columns
that may be read. A column level revoke on its own does nothing, because
Supabase grants table level `SELECT` on public tables by default and that
grant already covers every column. This form fails closed: a column added
later stays hidden until it is added to the grant. It is applied to
`tour_reviews`, hiding reviewer email and moderation notes, and to
`paystack_transactions`, hiding the reusable card token.

### Service role key

The Supabase service role key bypasses RLS. It is used only in server code
that has no user session to act for, or that must write rows no client may
write: the Paystack webhook, creating bookings and orders after recomputing
their totals, recording email delivery, and the analytics rollup job. Where a
write can be expressed as a single database operation, a `security definer`
function is preferred over the service role, per `design.md` B8. The key is
never imported into a Client Component and never reaches the browser bundle.

### Payments

Amounts are never trusted from the client. The client sends a cart or booking
reference, the server recomputes the total from the database, and only then
initialises the transaction. Webhook payloads are rejected unless the
`x-paystack-signature` HMAC verifies against the secret key.

### Sessions

Supabase Auth stores the session in httpOnly cookies. `middleware.ts` refreshes
the session and enforces route protection. This is the actual fix for the
broken check described in section 2.

## 7. Deployment

```
Cloudflare DNS  ->  Vercel  ->  Supabase
                      |
                      +-- Paystack, outbound API and inbound webhook
                      +-- Resend, outbound email
```

The production domain is **`techtourghana.com`**. Every canonical URL, sitemap
entry, structured data reference, redirect target and email link uses it. There
is no second public hostname.

- Cloudflare holds the zone for `techtourghana.com`. The apex and `www` point at
  Vercel with the orange proxy cloud disabled, so Vercel can issue and renew
  certificates. One of the two is canonical and the other redirects to it, so
  the same page is never reachable at two addresses.
- Vercel deploys on push. `main` is production, every other branch gets a
  preview URL.
- Supabase runs one project with two environments, production and a branch for
  development.

### Environment variables

| Name | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client and server | Project endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client and server | Public key, constrained by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Bypasses RLS, webhook use only |
| `PAYSTACK_SECRET_KEY` | Server only | Transaction initialise and verify |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Client | Inline checkout |
| `RESEND_API_KEY` | Server only | Transactional email |
| `NEXT_PUBLIC_SITE_URL` | Client and server | Canonical origin. `https://techtourghana.com` in production, `http://localhost:3000` locally |

All of these are parsed through a Zod schema at startup. A missing or malformed
variable fails the build rather than surfacing at runtime.

## 8. Migration phases

**Phase 1, foundation.** Next.js project, Supabase project, schema migrations,
data import from the dump, RLS policies, environment validation.

**Phase 2, auth.** Supabase Auth wired up, including Google OAuth. Existing
users are imported with a forced password reset, because Django password hashes
do not transfer. Middleware route protection replaces the broken check.

**Phase 3, content.** Public pages read from Supabase through Server
Components. The `lib/api.ts` client is deleted.

**Phase 4, commerce.** Cart, checkout, Paystack initialise, verify, and
webhook. Bookings and orders. Confirmation email through Resend.

**Phase 5, deploy.** Cloudflare to Vercel, environment variables, production
smoke test.

**Phase 6, admin.** Custom staff dashboard. Until this ships, staff use the
Supabase dashboard for content management.

Detailed task breakdown lives in the plan folder.

## 9. Out of scope for phase 1

Carried forward deliberately, not forgotten.

- SMS and phone OTP. The Africa's Talking integration is not ported. Phone
  verification stays disabled until it returns.
- The MongoDB drivers in the old requirements file. Nothing in the codebase
  used them.
- GeoIP lookup on analytics. Vercel supplies request geography natively.
- PDF generation for email attachments.
- Visual redesign. The interface stays as it is. See `design.md` for what is
  documented versus what is being corrected.
