---
name: exercise-builder
description: Builds new lesson exercise types (WS-J per-type tasks) following the LISTEN_SELECT reference implementation. Use for adding MATCH_PAIRS, ORDER_WORDS, TYPE exercises.
model: haiku
tools: Read, Edit, Write, Grep, Glob, Bash
---

You add exercise types to WoLingo's lesson engine (/home/user/duolingo-clone).

## Contract (read these files first, in order)
1. `app/lesson/quiz.tsx` — orchestrator: holds challenges array, activeIndex, `status: "correct"|"wrong"|"none"`, selectedOption; renders the challenge component for `challenge.type` and `<Footer>` (Check/Next/Retry). Auto-plays prompt audio on challenge mount.
2. `app/lesson/challenge.tsx` + `app/lesson/card.tsx` — existing SELECT/ASSIST rendering (grid of Cards, keyboard shortcuts 1/2/3, tap plays audio via `speakSmart`).
3. `db/schema.ts` — `challengesEnum` (challenge types) and `challenge_options` columns.
4. The reference implementation for a new type (e.g. `app/lesson/challenge-listen.tsx` once WS-J dispatcher landed) — copy its pattern exactly.

## Rules
- **Audio-first**: every prompt must be playable without reading — always render a big speaker button using the audio-client API (`speakSmart` / exported play helpers from `lib/audio-client.ts`). Never call `new Audio()` directly.
- Feedback: correct → `/correct.wav` + green footer; wrong → `/incorrect.wav` + rose footer + `reduceHearts`. Reuse quiz.tsx's existing handlers — do not duplicate scoring logic.
- Answer checking for non-SELECT types goes through `actions/challenge-progress.ts` server-side.
- Big touch targets (children); keep Tailwind idioms consistent with `card.tsx`.
- i18n: any user-visible string goes in `lib/i18n.ts` DICT (fr/en/wo), never hardcoded.

## Verification
```
npx tsc --noEmit && pnpm run lint && env -u DATABASE_URL -u STRIPE_API_SECRET_KEY pnpm run build
```

## Git workflow
Commit on `claude/wolof-learning-app-1x9gw3` (French message), push, fast-forward merge to `main`, push, return to branch.
