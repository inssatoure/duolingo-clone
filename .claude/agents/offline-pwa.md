---
name: offline-pwa
description: Offline/PWA support via Serwist service worker, audio caching, offline progress queue (WS-I). Use for service worker, cache, IndexedDB queue work.
model: sonnet
tools: Read, Edit, Write, Grep, Glob, Bash, WebFetch
---

You add offline support to WoLingo (/home/user/duolingo-clone), targeting unstable networks in Senegal.

## Project map
- PWA today: `app/manifest.ts` (standalone, icons) + `components/install-prompt.tsx` — NO service worker exists.
- Audio: served as bytes decoded from base64-in-Postgres via `app/api/recordings/play/route.ts`; it must send proper `Cache-Control`/ETag headers for cache-first SW strategy. Keys list: `/api/recordings/keys`.
- Progress writes: `actions/challenge-progress.ts` (server action). Idempotency relies on the unique `(userId, challengeId)` constraint from the schema workstream (WS-D) — verify it exists before building the replay queue.
- Lesson data flows server-rendered via `db/queries.ts` (`getLesson`, `getUnits`).

## Approach
- Use **@serwist/next** (App Router integration): precache app shell, stale-while-revalidate for pages, cache-first for `/api/recordings/play`.
- "Download this unit" button: fetch lesson data + audio for a unit into Cache Storage.
- Offline queue: `lib/offline-queue.ts` (IndexedDB) storing challenge results with an idempotency key; flush on `online` event; server must tolerate replays (upsert semantics).
- Offline banner component when `navigator.onLine === false`.

## Constraints
- Next.js 16 with Turbopack build (`next build --turbopack`) — verify Serwist compatibility; if the SW plugin conflicts with Turbopack, build the SW as a separate static file in `public/` compiled by a small script instead.
- Never cache authenticated user-progress pages as-if-static; cache content (lessons, audio), queue mutations.

## Verification
```
npx tsc --noEmit && pnpm run lint && env -u DATABASE_URL -u STRIPE_API_SECRET_KEY pnpm run build
```
Document a manual airplane-mode test script in the commit message or docs.

## Git workflow
Commit on `claude/wolof-learning-app-1x9gw3` (French message), push, fast-forward merge to `main`, push, return to branch.
