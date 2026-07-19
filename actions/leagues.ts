"use server";

import { auth } from "@clerk/nextjs/server";
import { eq, and, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { getUserProgress } from "@/db/queries";
import { userProgress, weeklyLeagues, userLeagueParticipation } from "@/db/schema";

export const getUserLeague = async () => {
  const { userId } = await auth();

  if (!userId) return null;

  const currentUserProgress = await getUserProgress();

  if (!currentUserProgress?.leagueId) return null;

  const league = await db.query.weeklyLeagues.findFirst({
    where: eq(weeklyLeagues.id, currentUserProgress.leagueId),
  });

  return league;
};

export const getWeeklyLeagueRankings = async () => {
  const { userId } = await auth();

  if (!userId) return null;

  const currentUserProgress = await getUserProgress();

  if (!currentUserProgress?.leagueId) return null;

  // Get current week's start and end
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Get all users in the same league with their weekly XP
  const leagueUsers = await db.query.userProgress.findMany({
    where: eq(userProgress.leagueId, currentUserProgress.leagueId),
    columns: {
      userId: true,
      userName: true,
      userImageSrc: true,
      points: true,
    },
  });

  // Get weekly participation data
  const participations = await db.query.userLeagueParticipation.findMany({
    where: and(
      eq(userLeagueParticipation.leagueId, currentUserProgress.leagueId),
      gte(userLeagueParticipation.weekStart, weekStart),
      lte(userLeagueParticipation.weekEnd, weekEnd)
    ),
  });

  // Combine and calculate rankings
  const rankings = leagueUsers.map((user) => {
    const participation = participations.find((p) => p.userId === user.userId);
    return {
      ...user,
      weeklyXp: participation?.xpEarned || 0,
    };
  });

  // Sort by weekly XP and assign ranks
  rankings.sort((a, b) => b.weeklyXp - a.weeklyXp);

  return rankings.map((user, index) => ({
    ...user,
    rank: index + 1,
    isCurrentUser: user.userId === userId,
  }));
};

export const calculateWeeklyLeagueUpdate = async () => {
  // This should be run by a cron job weekly
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Get all leagues
  const allLeagues = await db.query.weeklyLeagues.findMany();

  // Process each league
  for (const league of allLeagues) {
    // Get users in this league
    const leagueUsers = await db.query.userProgress.findMany({
      where: eq(userProgress.leagueId, league.id),
    });

    // Get their weekly XP
    const participations = await db.query.userLeagueParticipation.findMany({
      where: and(
        eq(userLeagueParticipation.leagueId, league.id),
        gte(userLeagueParticipation.weekStart, weekStart),
        lte(userLeagueParticipation.weekEnd, weekEnd)
      ),
    });

    // Sort by XP and determine promotions/relegations
    const sortedUsers = leagueUsers
      .map((user) => {
        const participation = participations.find((p) => p.userId === user.userId);
        return {
          user,
          weeklyXp: participation?.xpEarned || 0,
        };
      })
      .sort((a, b) => b.weeklyXp - a.weeklyXp);

    // Update user leagues based on rankings
    for (let i = 0; i < sortedUsers.length; i++) {
      const { user, weeklyXp } = sortedUsers[i];
      const rank = i + 1;

      // Determine if user should be promoted or relegated
      let newLeagueId = league.id;
      let promoted = false;
      let relegated = false;

      // Top performers get promoted (top 30% move up)
      if (rank <= Math.ceil(sortedUsers.length * 0.3) && league.id > 1) {
        newLeagueId = league.id - 1;
        promoted = true;
      }
      // Bottom performers get relegated (bottom 30% move down)
      else if (rank > Math.ceil(sortedUsers.length * 0.7) && league.id < allLeagues.length) {
        newLeagueId = league.id + 1;
        relegated = true;
      }

      // Update user's league
      await db
        .update(userProgress)
        .set({ leagueId: newLeagueId })
        .where(eq(userProgress.userId, user.userId));

      // Update participation record
      const existingParticipation = participations.find(
        (p) => p.userId === user.userId
      );

      if (existingParticipation) {
        await db
          .update(userLeagueParticipation)
          .set({
            rank,
            promoted,
            relegated,
          })
          .where(eq(userLeagueParticipation.id, existingParticipation.id));
      }
    }
  }

  revalidatePath("/leagues");
  revalidatePath("/learn");
  revalidatePath("/leaderboard");
};

export const initializeUserLeague = async () => {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized.");

  const currentUserProgress = await getUserProgress();

  if (!currentUserProgress) throw new Error("User progress not found.");

  // If user already has a league, don't reinitialize
  if (currentUserProgress.leagueId) return;

  // Start all users in Bronze League (highest ID = lowest tier)
  const bronzeLeague = await db.query.weeklyLeagues.findFirst({
    where: eq(weeklyLeagues.name, "Bronze League"),
  });

  if (!bronzeLeague) throw new Error("Bronze league not found.");

  await db
    .update(userProgress)
    .set({ leagueId: bronzeLeague.id })
    .where(eq(userProgress.userId, userId));

  revalidatePath("/learn");
  revalidatePath("/leagues");
};
