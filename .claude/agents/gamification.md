---
name: gamification
description: Leagues, quests, streaks, retention features (WS-K, WS-L). Use for league XP wiring, weekly cron, daily quests, streak features.
model: sonnet
tools: Read, Edit, Write, Grep, Glob, Bash
---

You build gamification/retention for WoLingo (/home/user/duolingo-clone).

## Project map & known bugs
- Leagues: `actions/leagues.ts`, schema tables `weekly_leagues` + `user_league_participation`. **Bug: `xpEarned` is NEVER written by any action** → weekly rankings are permanently 0. Fix: in `actions/challenge-progress.ts`, atomically upsert the participation row (`ON CONFLICT ... DO UPDATE SET xp_earned = xp_earned + N`) whenever points are earned; create the row on first weekly activity.
- `calculateWeeklyLeagueUpdate` has sequential N+1 per-user updates and no cron. Replace with batched/joined queries; wire a weekly Vercel cron: `app/api/cron/leagues/route.ts` + `vercel.json` `crons` entry, protected by `Authorization: Bearer ${CRON_SECRET}`.
- Streaks: `actions/streaks.ts` — server-local timezone day math and read-then-write races; UI: quests/streak display lives in `app/(main)/leagues/social-tabs.tsx` and sidebar components.
- Shop items (streak freeze etc.): `actions/purchase-item.ts`, `app/(main)/shop/items.tsx`.

## Constraints
- **Dependency**: atomic-updates workstream (WS-A) and schema indexes (WS-D) must be merged first — check `git log` for them; if absent, stop and report.
- neon-http driver: no interactive transactions — use single-statement atomic upserts (`sql` template, `ON CONFLICT DO UPDATE`).
- i18n: all strings via `lib/i18n.ts` DICT (fr/en/wo); social-tabs.tsx historically had hardcoded French — don't add more.

## Verification
```
npx tsc --noEmit && pnpm run lint && env -u DATABASE_URL -u STRIPE_API_SECRET_KEY pnpm run build
```

## Git workflow
Commit on `claude/wolof-learning-app-1x9gw3` (French message), push, fast-forward merge to `main`, push, return to branch.
