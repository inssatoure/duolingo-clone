"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
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

  const currentUserStreak = await getUserStreak();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!currentUserStreak) {
    // First time practicing - initialize streak
    await db.insert(userStreaks).values({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastPracticeDate: today,
      streakFreezeActive: false,
    });

    revalidatePath("/learn");
    revalidatePath("/quests");
    revalidatePath("/leaderboard");
    return;
  }

  // Check if streak freeze is active
  if (currentUserStreak.streakFreezeActive && currentUserStreak.streakFreezeUntil) {
    if (currentUserStreak.streakFreezeUntil > now) {
      // Streak freeze is still active, don't reset streak
      await db
        .update(userStreaks)
        .set({
          lastPracticeDate: today,
        })
        .where(eq(userStreaks.userId, userId));

      revalidatePath("/learn");
      revalidatePath("/quests");
      revalidatePath("/leaderboard");
      return;
    } else {
      // Streak freeze expired, deactivate it
      await db
        .update(userStreaks)
        .set({
          streakFreezeActive: false,
          streakFreezeUntil: null,
        })
        .where(eq(userStreaks.userId, userId));
    }
  }

  // Check if practiced today
  if (currentUserStreak.lastPracticeDate) {
    const lastPractice = new Date(currentUserStreak.lastPracticeDate);
    const lastPracticeDay = new Date(
      lastPractice.getFullYear(),
      lastPractice.getMonth(),
      lastPractice.getDate()
    );

    if (lastPracticeDay.getTime() === today.getTime()) {
      // Already practiced today, no update needed
      return;
    }

    // Check if practiced yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastPracticeDay.getTime() === yesterday.getTime()) {
      // Consecutive day - increment streak
      const newStreak = currentUserStreak.currentStreak + 1;
      await db
        .update(userStreaks)
        .set({
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, currentUserStreak.longestStreak),
          lastPracticeDate: today,
        })
        .where(eq(userStreaks.userId, userId));
    } else {
      // Streak broken - reset to 1
      await db
        .update(userStreaks)
        .set({
          currentStreak: 1,
          lastPracticeDate: today,
        })
        .where(eq(userStreaks.userId, userId));
    }
  } else {
    // No last practice date - start new streak
    await db
      .update(userStreaks)
      .set({
        currentStreak: 1,
        lastPracticeDate: today,
      })
      .where(eq(userStreaks.userId, userId));
  }

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

  await db.transaction(async (tx) => {
    await tx
      .update(userProgress)
      .set({
        cfaBalance: currentUserProgress.cfaBalance - STREAK_FREEZE_COST,
      })
      .where(eq(userProgress.userId, userId));

    await tx
      .update(userStreaks)
      .set({
        streakFreezeActive: true,
        streakFreezeUntil: freezeUntil,
      })
      .where(eq(userStreaks.userId, userId));
  });

  revalidatePath("/shop");
  revalidatePath("/learn");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
};
