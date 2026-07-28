# IROORI Development Blueprint — v2

This is the repository-level source of truth. It supersedes v1 while keeping
its core philosophy: a tree never dies, loses progress, or judges its owner.

## Product direction

IROORI is a gentle place to return to. It helps people make a small step toward
one wish, leave a light record when they want to, and see that time as a tree.
There are no streaks, rankings, deadlines, or guilt-inducing notifications.

## v2 product rules

1. One person begins with one private tree. A tree starts with a `wish` and a
   concrete `step` (today's small action).
2. Watering is available once per Korean calendar day. A written journal entry
   is optional; watering alone is meaningful.
3. Only water records change tree growth. Time changes the season and can shape
   a welcome-back message, but never removes growth.
4. Growth uses a logarithmic curve: `log(1 + 0.3 * waterCount) / log(19)`,
   capped at 1. A tree becomes ready to bloom after 60 water records.
5. Each water record also changes visual detail: leaves, flowers, moss, and
   birds. A first water must be visibly meaningful.
6. Return messages are based on absence length and always welcome the person
   back without asking for an explanation.
7. Journal rhythm can be described as an observation, never a score or a
   failure.

## Trusted-server authority

- Clients may create their initial tree and optional journal text, but they
  never change aggregate growth.
- A server transaction creates the day's journal, increments `waterCount`,
  recalculates `stageValue`, updates visual-detail counters, and records
  `lastWateredAt` atomically.
- Bloom and later lifecycle transitions remain trusted-server writes.

## Scope and sequencing

Implemented now: Google/Email authentication, first tree onboarding, private
tree home, optional journal watering, v2 logarithmic growth, flower-ready
state, seasonal visuals, welcome-back copy, and gentle rhythm description.

Deferred until the completion rate reaches 10%: fruit time capsules, public
forest, cheers, push notifications, multi-tree expansion, sharing, and social
features. These are deliberately not prerequisites for a calm first product.

## Deployment

The app is a Next.js App Router service deployed to Cloudflare Workers through
OpenNext. Firebase provides authentication and Firestore. Protected server
routes verify the Firebase session cookie before trusted writes.
