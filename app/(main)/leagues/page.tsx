import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getUserLeague, getWeeklyLeagueRankings } from "@/actions/leagues";
import { FeedWrapper } from "@/components/feed-wrapper";
import { Promo } from "@/components/promo";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { UserProgress } from "@/components/user-progress";
import {
  getTopTenUsers,
  getUserProgress,
  getUserSubscription,
  getUserStreak,
} from "@/db/queries";
import { DICT, LOCALE_COOKIE, isLocale } from "@/lib/i18n";

import { SocialTabs } from "./social-tabs";

const LeaguesPage = async () => {
  await auth.protect();

  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const t = DICT[isLocale(cookieLocale) ? cookieLocale : "fr"];

  const [userProgress, userSubscription, userStreak, userLeague, leagueRankings, leaderboard] =
    await Promise.all([
      getUserProgress(),
      getUserSubscription(),
      getUserStreak(),
      getUserLeague(),
      getWeeklyLeagueRankings(),
      getTopTenUsers(),
    ]);

  if (!userProgress || !userProgress.activeCourse) redirect("/courses");

  const isPro = !!userSubscription?.isActive;

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        <UserProgress
          activeCourse={userProgress.activeCourse}
          hearts={userProgress.hearts}
          points={userProgress.points}
          hasActiveSubscription={isPro}
          currentStreak={userStreak?.currentStreak || 0}
          longestStreak={userStreak?.longestStreak || 0}
          streakFreezeActive={userStreak?.streakFreezeActive || false}
          cfaBalance={userProgress.cfaBalance || 0}
        />
        {!isPro && <Promo />}
      </StickyWrapper>

      <FeedWrapper>
        <SocialTabs
          t={t}
          leagueName={userLeague?.name || "Bronze League"}
          leagueRankings={leagueRankings ?? []}
          leaderboard={leaderboard}
          points={userProgress.points}
        />
      </FeedWrapper>
    </div>
  );
};

export default LeaguesPage;
