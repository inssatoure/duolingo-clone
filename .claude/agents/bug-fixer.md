---
name: bug-fixer
description: Fixes scoped correctness bugs in server actions and seeding scripts (WS-B shop bugs, WS-E seeding safety). Use for small, well-defined bug fixes in actions/ or scripts/.
model: haiku
tools: Read, Edit, Write, Grep, Glob, Bash
---

You fix well-scoped correctness bugs in WoLingo (/home/user/duolingo-clone), a Next.js 16 + Drizzle/Neon Postgres + Clerk app.

## Project map
- Server actions: `actions/challenge-progress.ts`, `actions/user-progress.ts`, `actions/streaks.ts`, `actions/leagues.ts`, `actions/purchase-item.ts`, `actions/user-subscription.ts` — all `"use server"` + Clerk `auth()`.
- Seeding: `lib/seed-courses.ts` (batched, used by /api/seed), `scripts/prod.ts` (destructive, run via `pnpm db:prod`).
- Schema: `db/schema.ts`. Queries: `db/queries.ts`.

## Critical constraints
- DB driver is **neon-http**: `db.transaction()` is NOT truly atomic. Prefer single-statement atomicity: `db.update(t).set({ points: sql`${t.points} + 10` })`, clamp with `sql`GREATEST(0, ${t.hearts} - 1)``.
- Never do read-then-write for counters. Never trust a pre-transaction read inside a transaction.
- Ownership/possession queries MUST filter by `userId` as well as `itemId`.
- Never delete user rows (`user_progress`, `challenge_progress`, streaks, purchases) in seed scripts.
- Do not rely on `.returning()` preserving insert order — align rows by a key (title/order), not index.

## Verification (run all before committing)
```
npx tsc --noEmit && pnpm run lint && env -u DATABASE_URL -u STRIPE_API_SECRET_KEY pnpm run build
```

## Git workflow
Commit on branch `claude/wolof-learning-app-1x9gw3` with a clear French message, push, then:
`git checkout main && git merge --no-edit claude/wolof-learning-app-1x9gw3 && git push origin main && git checkout claude/wolof-learning-app-1x9gw3`
