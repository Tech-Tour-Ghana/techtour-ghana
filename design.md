# TechTour Ghana, Design System

This document has two parts. Part A is the visual system for the interface.
Part B is the design system for the server side, meaning the conventions every
API route, query, and error path follows.

The interface is not being redesigned. Part A records what the current site
already does, corrects the places where it contradicts itself, and gives the
rebuild a single source of truth to build against.

---

# Part A, Interface

## A1. Where the current values came from

The existing frontend has no design tokens. Colours are written as raw hex
literals across roughly 4,700 lines of CSS and component markup. The palette
below is what actually ships, recovered by counting every hex literal in the
codebase.

The Tailwind config is misleading and should not be trusted. It declares
`primary: #2563eb` and `secondary: #7c3aed`. Neither value appears in the
rendered interface even once.

| Colour | Occurrences | Role |
| --- | --- | --- |
| `#139ea2` | 360 | The brand. Primary teal |
| `#ffffff` | 336 | Surface |
| `#e6a64d` | 159 | Accent gold |
| `#1a1a2e` | 137 | Deep navy, hero and footer grounds |
| `#0d7a7d` | 75 | Primary teal, hover and pressed |
| `#d4953a` | 54 | Accent gold, hover |

## A2. Tokens

Defined once as CSS custom properties, consumed through Tailwind. No component
writes a hex literal.

### Brand

| Token | Light | Purpose |
| --- | --- | --- |
| `--color-primary` | `#139ea2` | Primary actions, links, active state |
| `--color-primary-hover` | `#0d7a7d` | Hover and pressed |
| `--color-primary-subtle` | `#139ea2` at 10 percent | Tinted backgrounds, selected rows |
| `--color-accent` | `#e6a64d` | Highlights, badges, ratings |
| `--color-accent-hover` | `#d4953a` | Accent hover |
| `--color-ink` | `#1a1a2e` | Hero and footer grounds |
| `--color-ink-raised` | `#222244` | Raised surfaces on ink |

### Semantic

| Token | Value | Purpose |
| --- | --- | --- |
| `--color-success` | `#10b981` | Confirmed booking, successful payment |
| `--color-warning` | `#f59e0b` | Pending payment, expiring hold |
| `--color-error` | `#ef4444` | Failed payment, validation failure |
| `--color-info` | `#3b82f6` | Neutral notice |

Status colour is never the only signal. Every status carries a text label, so
the interface stays readable without colour vision.

### Surfaces and text, by theme

The site ships three themes, switched by a `data-theme` attribute on the root
element. All three are kept.

| Token | Light | Dim | Dark |
| --- | --- | --- | --- |
| `--bg` | `#ffffff` | `#121212` | `#0d0d0d` |
| `--bg-subtle` | `#f9f9f9` | `#1a1a1a` | `#1a1a1a` |
| `--surface` | `#ffffff` | `#1e1e1e` | `#1a1a1a` |
| `--text` | `#111827` | `#e0e0e0` | `#e8e8e8` |
| `--text-muted` | `#6b7280` | `#909090` | `#a0a0b0` |
| `--text-subtle` | `#9ca3af` | `#707070` | `#b0b0b0` |
| `--border` | `#e5e7eb` | `#2a2a2a` | `#333333` |

The current implementation forces themes with roughly 40 `!important`
overrides on Tailwind utility classes, such as `[data-theme="dark"] .bg-white`.
Tokens remove the need for every one of them. When the rebuild reaches a
component, the overrides for it are deleted.

## A3. Type

Inter, loaded through `next/font/google`, is the only family. It stays.

| Role | Size | Weight | Notes |
| --- | --- | --- | --- |
| Display | 2.25rem to 3rem | 700 | Hero headings, fluid across breakpoints |
| Section title | 1.875rem, 2.25rem at medium | 700 | Centred, the existing `section-title` |
| Card title | 1.125rem | 600 | |
| Body | 1rem | 400 | Line height 1.6 |
| Small | 0.875rem | 400 | Metadata, captions |
| Label | 0.75rem | 500 | Uppercase, letter spacing 0.05em |

Body copy caps at roughly 65 characters per line. The existing
`section-subtitle` already does this with `max-w-2xl`.

## A4. Spacing, radius, elevation

Spacing uses the Tailwind 4px scale. Section vertical rhythm is 4rem on mobile
and 6rem from the medium breakpoint up.

| Radius | Value | Applied to |
| --- | --- | --- |
| `sm` | 0.375rem | Inputs, small badges |
| `md` | 0.5rem | Buttons |
| `lg` | 0.75rem | Cards, glass panels |
| `xl` | 1rem | Modals, feature panels |
| `full` | 9999px | Pills, avatars |

Elevation runs three levels: resting cards, raised cards on hover, and
overlays. Dark and dim themes use stronger, lower-opacity shadows, which the
current CSS already does.

Container width is 1280px, with 1rem side padding, 1.5rem from the small
breakpoint, and 2rem from large. This matches the existing `container-custom`
and does not change.

## A5. The glass treatment

Feature cards use a translucent panel over imagery: white at 15 percent
opacity, a 10px backdrop blur, a 1px border of white at 15 percent, and a
`lg` radius.

This is the site's most distinctive visual signature and it stays. Two fixes:

- It currently ships with roughly a dozen `!important` declarations forcing
  visibility, which means something else is fighting it. The rebuild uses one
  component with no overrides.
- Backdrop blur has no fallback. Where it is unsupported, the panel must fall
  back to a solid surface at full opacity, or the text on it becomes
  unreadable.

## A6. Components

Primitives live in `components/ui`, one file each, and are the only place
tokens are touched directly.

`Button`, with variants `primary`, `secondary`, `ghost`, and `danger`, and
sizes `sm`, `md`, `lg`. The existing `btn-primary` and `btn-secondary` classes
map onto the first two variants.

`Input`, `Select`, `Textarea`, each with a label, help text, and an error slot.
Error state uses `--color-error` on the border plus a message below. Colour
alone never signals the error.

`Card`, with `default` and `glass` variants.

`Badge`, carrying the semantic colours from A2.

`Modal`, `Toast`, `Skeleton`, `EmptyState`.

Every interactive element states a loading state, a disabled state, and an
empty state. The old codebase has a `Loading` component but applies it
inconsistently, so several pages show nothing at all while fetching.

## A7. Accessibility

These are requirements, not aspirations.

- Body text meets WCAG AA at 4.5 to 1. Large text meets 3 to 1. Teal `#139ea2`
  on white measures roughly 3.1 to 1, so it passes for large text and UI
  borders but **fails for body copy**. Body text never uses teal as its colour.
  Links inside paragraphs use `--color-primary-hover`, which is darker, plus an
  underline.
- Focus is always visible. The existing ring is a 2px outline in `#02818a` with
  a 2px offset. It is kept, and it is never removed without a replacement.
- Every interactive element is reachable by keyboard, in a sensible order.
- Images carry alt text. Decorative images carry an empty alt attribute.
- Forms use real labels, not placeholder text standing in for one.
- Motion respects `prefers-reduced-motion`. The existing slide and fade
  animations are suppressed under it.
- Touch targets are at least 44 by 44 pixels.

## A8. Responsive

Mobile first. Tailwind default breakpoints, unchanged: 640, 768, 1024, 1280,
and 1536 pixels.

Grids collapse to a single column below 640px. Tables scroll inside their own
horizontal container rather than forcing the page to scroll sideways. The page
body never scrolls horizontally at any width.

---

# Part B, Server

The server side has no separate runtime. These conventions apply to Route
Handlers, Server Actions, and any data access in Server Components.

## B1. Shape of the layer

```
Server Component        Reads directly, no fetch round trip
Server Action           Mutations driven by a form
Route Handler           Third-party callbacks, webhooks, client-side fetches
```

Prefer, in order: read in a Server Component, mutate with a Server Action, and
only reach for a Route Handler when something external needs a URL to call.

The old API exposed 45 flat endpoints, many of them thin wrappers around a
single table read. Most disappear, because a Server Component queries the table
directly.

## B2. Route naming

Where a Route Handler is genuinely needed, it is a resource path, not a verb.

| Old | New |
| --- | --- |
| `/api/tours/`, `/api/tour/<slug>/` | Server Component read, no route |
| `/api/footer/settings/`, plus five siblings | One `site_content` query, no route |
| `/api/auth/login/`, `/logout/`, `/refresh/`, `/status/`, `/csrf/` | Supabase Auth, no routes |
| `/api/analytics/track-activity/` | `POST /api/analytics/events` |
| Paystack initialise and verify | `POST /api/paystack/checkout`, `GET /api/paystack/verify/[reference]` |
| Paystack webhook | `POST /api/paystack/webhook` |

The six separate footer endpoints become one query. The five auth endpoints
disappear entirely.

## B3. Response shape

Success returns the resource, with the HTTP status carrying the meaning.

```json
{ "data": { } }
```

Failure returns a stable, machine-readable code plus a message safe to show a
user.

```json
{ "error": { "code": "INSUFFICIENT_SPOTS", "message": "Only 2 spots remain on this date." } }
```

The old API returned `{ "success": true, ... }` alongside a 200 status even on
failure, which forced the client to check two things for every call. That
pattern is dropped. The status code is authoritative.

| Status | Used for |
| --- | --- |
| 200 | Read succeeded |
| 201 | Resource created |
| 400 | Request failed validation |
| 401 | Not signed in |
| 403 | Signed in, not permitted |
| 404 | No such resource |
| 409 | Conflict, such as a double booking |
| 422 | Well formed but not actionable, such as a sold out schedule |
| 429 | Rate limited |
| 500 | Unhandled fault |

## B4. Validation

Every input crossing a trust boundary is parsed with Zod before anything else
runs. Request bodies, query parameters, route parameters, webhook payloads, and
environment variables.

Schemas live in `lib/validation`, one module per domain, and are shared between
the client form and the server handler so the two cannot drift.

Parse, do not validate. The handler works with the parsed, typed result, never
the raw input.

## B5. Errors

Three rules.

- Never swallow an error. The old client returned an empty array from every
  failed dashboard fetch, so a server outage and a genuinely empty list looked
  identical to the user.
- Never leak internals. Database messages, stack traces, and vendor payloads
  are logged, not returned.
- Always distinguish expected failures from faults. A sold out tour is an
  expected outcome with its own code. A dropped database connection is a fault.

Faults log with correlating context, meaning the route, the user id if present,
and the input that triggered it, with secrets redacted.

## B6. Money and payments

- Money is `numeric(10,2)` in the database and an integer of minor units on the
  wire. Never a float.
- Currency is always explicit. Default `GHS`.
- The server recomputes every total from the database. A client-supplied amount
  is ignored.
- Payment state transitions in one direction only: `pending` to `success`,
  `failed`, or `abandoned`. A terminal state never moves again.
- The webhook is the source of truth for payment success, not the browser
  redirect. A user who closes the tab mid-payment still gets a confirmed order.
- The webhook is idempotent, keyed on the Paystack reference. Paystack retries,
  and a retry must never create a second order.
- Every webhook call is logged before processing, matching the existing
  `PaystackWebhookLog` behaviour, which was a good decision worth keeping.

## B7. Authorisation

Row level security is the enforcement boundary, not application code. A handler
that forgets a check still cannot read another user's order, because the policy
refuses it.

Application checks exist for clear error messages, not for security. The policy
is the security.

The service role key appears in exactly one place, the Paystack webhook, which
has no user session to act on behalf of.

## B8. Data access

- Select named columns, never `*`. It keeps payloads small and makes a schema
  change a visible diff.
- Filter and paginate in the query, not in JavaScript after fetching.
- Anything that reads a list takes a limit. No unbounded queries.
- Multi-table writes go through a Postgres function so they commit or fail as
  one unit. Creating a booking, decrementing available spots, and recording the
  transaction is one operation, not three.
- Generated types in `types/database.ts` are regenerated whenever a migration
  lands, and they are committed.

## B9. Caching

Public content is statically rendered and revalidated by tag. Publishing a tour
revalidates the tour tag rather than the whole site.

Anything user specific is dynamic and never cached at the edge.

Payment verification is never cached, under any circumstances.
