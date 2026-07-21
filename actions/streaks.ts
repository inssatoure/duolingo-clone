"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { getUserProgress } from "@/db/queries";
import { userStreaks, userProgress } from "@/db/schema";

export const getUserStreak = async () => {
  const { userId } = await auth();

  if (!userId) return null;

  const data = await db.query.userStreaks.findFirst({
    where: eq(userStreaks.userId, userId),
  });

  return data;
};

export const updateStreak = async () => {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized.");

  // NOTE (timezone limitation): "today"/"yesterday" are computed from the
  // Node process's local timezone (server clock), not the user's timezone.
  // This is fine for a single-region deployment but means a user near a
  // midnight boundary in a different timezone than the server can see their
  // streak roll over at the "wrong" local time for them. A real fix needs a
  // per-user timezone or client-supplied local date; out of scope for WS-A.
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Single atomic UPSERT: no read-then-write race between concurrent
  // requests (e.g. two challenge completions firing close together). All
  // branching (first-time row, active streak freeze, already-practiced-today
  // no-op, consecutive day increment, broken streak reset) is expressed as
  // SQL CASE expressions evaluated by Postgres against the current row, not
  // against a value read earlier in this request.
  const freezeStillActive = sql`(${userStreaks.streakFreezeActive} AND ${userStreaks.streakFreezeUntil} IS NOT NULL AND ${userStreaks.streakFreezeUntil} > now())`;
  const practicedToday = sql`(${userStreaks.lastPracticeDate} IS NOT NULL AND date_trunc('day', ${userStreaks.lastPracticeDate}) = date_trunc('day', ${today}::timestamp))`;
  const practicedYesterday = sql`(${userStreaks.lastPracticeDate} IS NOT NULL AND date_trunc('day', ${userStreaks.lastPracticeDate}) = date_trunc('day', ${today}::timestamp) - interval '1 day')`;

  const newCurrentStreak = sql`(CASE
    WHEN ${freezeStillActive} OR ${practicedToday} THEN ${userStreaks.currentStreak}
    WHEN ${practicedYesterday} THEN ${userStreaks.currentStreak} + 1
    ELSE 1
  END)`;

  await db
    .insert(userStreaks)
    .values({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastPracticeDate: today,
      streakFreezeActive: false,
    })
    .onConflictDoUpdate({
      target: userStreaks.userId,
      set: {
        currentStreak: newCurrentStreak,
        longestStreak: sql`GREATEST(${userStreaks.longestStreak}, ${newCurrentStreak})`,
        lastPracticeDate: sql`(CASE WHEN ${practicedToday} THEN ${userStreaks.lastPracticeDate} ELSE ${today}::timestamp END)`,
        streakFreezeActive: sql`(CASE WHEN ${freezeStillActive} THEN true ELSE false END)`,
        streakFreezeUntil: sql`(CASE WHEN ${freezeStillActive} THEN ${userStreaks.streakFreezeUntil} ELSE NULL END)`,
      },
    });

  revalidatePath("/learn");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
};

export const activateStreakFreeze = async () => {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized.");

  const currentUserProgress = await getUserProgress();
  const currentUserStreak = await getUserStreak();

  if (!currentUserProgress) throw new Error("User progress not found.");
  if (!currentUserStreak) throw new Error("User streak not found.");

  // Check if user has enough CFA (500 CFA for streak freeze)
  const STREAK_FREEZE_COST = 500;

  if (currentUserProgress.cfaBalance < STREAK_FREEZE_COST) {
    throw new Error("Not enough CFA for streak freeze.");
  }

  // Activate streak freeze for 24 hours
  const now = new Date();
  const freezeUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // neon-http can't do interactive transactions, so instead of the earlier
  // read-then-write (which could double-spend under a race) this debits
  // cfaBalance atomically, clamped at 0 and guarded by a WHERE clause that
  // only spends if the balance still covers the cost at write time.
  const debited = await db
    .update(userProgress)
    .set({
      cfaBalance: sql`GREATEST(0, ${userProgress.cfaBalance} - ${STREAK_FREEZE_COST})`,
    })
    .where(
      and(
        eq(userProgress.userId, userId),
        gte(userProgress.cfaBalance, STREAK_FREEZE_COST)
      )
    )
    .returning({ userId: userProgress.userId });

  if (debited.length === 0) {
    throw new Error("Not enough CFA for streak freeze.");
  }

  await db
    .update(userStreaks)
    .set({
      streakFreezeActive: true,
      streakFreezeUntil: freezeUntil,
    })
    .where(eq(userStreaks.userId, userId));

  revalidatePath("/shop");
  revalidatePath("/learn");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
};
