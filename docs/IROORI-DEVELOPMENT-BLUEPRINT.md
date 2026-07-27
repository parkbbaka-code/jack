# IROORI Development Blueprint — Implementation Edition

This document is the repository-level source of truth. It applies the original
product blueprint with the engineering corrections agreed before implementation.

## Product invariants

1. One wish creates one tree. A user may own multiple trees over time.
2. Time changes only the season. It never changes tree size or growth progress.
3. Journal records are water and are the only input that increases tree size.
4. Cheers are sunlight: they add warmth, fireflies, and bloom ambience, but never
   make a tree grow faster.
5. Trees never die, wither, lose progress, or punish an absent user.
6. Notification copy is an invitation, never guilt or pressure.

## Authentication decision

- MVP providers: Google and Email. Apple is a fast-follow item.
- Kakao and Naver custom-token login are postponed until after MVP validation.
- The browser exchanges a recent Firebase ID token at `POST /api/auth/session`.
- The server stores a five-day `httpOnly`, `sameSite=lax` session cookie.
- `proxy.ts` checks only cookie presence because Cloudflare middleware does not
  support the Node.js runtime. Protected server layouts and API handlers perform
  authoritative Firebase Admin session verification.

## Growth authority

- A tree reaches the ready-to-bloom stage after 30 daily water records, or about one month.
- Clients may create immutable journal entries but never write aggregate growth.
- A trusted server transaction or Firebase Cloud Function increments
  `waterCount`, recomputes `stageValue`, and updates `lastWateredAt`.
- Bloom, fruit creation, status transitions, and denormalized counters are also
  trusted-server writes. Firestore rules reject those fields from clients.
- `features/tree/lib/growth.ts` is the shared pure calculation. Its signature
  intentionally accepts only `waterCount`; there is no time or cheer argument.

## MVP scope

Included: project foundation, Google/Email auth, onboarding and first seed, tree
renderer, journal/water, growth, bloom/fruit, public forest and cheers, gentle
welcome-back, season visuals, profile, and essential settings.

Deferred: payments, premium catalog, Kakao/Naver login, AI, collaborative trees,
native wrappers, widgets, wearables, commerce, and blockchain features.

## Deployment decision

- Next.js App Router deploys to Cloudflare Workers through OpenNext.
- Route handlers and React Server Components are supported.
- `nodejs_compat` is enabled. Node.js middleware is not used.
- Firebase Admin compatibility must be verified with `pnpm preview` before the
  first production deployment. If the Admin SDK is not reliable in Workers, the
  session and growth-authority endpoints move to Firebase Cloud Functions behind
  the same service interfaces.

## Layering

`app -> features -> services -> lib`

Feature internals are private. Cross-feature reuse belongs in shared components,
hooks, services, constants, or domain types. TanStack Query owns server state,
Zustand owns ephemeral UI state, and auth state is exposed through a provider.

## Current implementation order

0. Foundation and architecture invariants — complete.
1. Firebase project configuration — complete.
2. Google/Email auth and session exchange — complete.
3. Onboarding and atomic first wish/tree creation — complete.
4. Deterministic SVG tree renderer — complete.
5. Journal history and server-authoritative daily watering — complete.
6. Growth display — complete.
7. Bloom and fruit, then forest and cheers.
8. Profile and essential settings.
