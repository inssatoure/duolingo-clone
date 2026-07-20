import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { FeedWrapper } from "@/components/feed-wrapper";
import { Promo } from "@/components/promo";
import { Quests } from "@/components/quests";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { UserProgress } from "@/components/user-progress";
import {
  getTopTenUsers,
  getUserProgress,
  getUserSubscription,
  getUserStreak,
} from "@/db/queries";
import { DICT, LOCALE_COOKIE, isLocale } from "@/lib/i18n";

const LeaderboardPage = async () => {
  await auth.protect();

  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const t = DICT[isLocale(cookieLocale) ? cookieLocale : "fr"];

  const userProgressData = getUserProgress();
  const userSubscriptionData = getUserSubscription();
  const leaderboardData = getTopTenUsers();
  const userStreakData = getUserStreak();

  const [userProgress, userSubscription, leaderboard, userStreak] = await Promise.all([
    userProgressData,
    userSubscriptionData,
    leaderboardData,
    userStreakData,
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
        <Quests points={userProgress.points} />
      </StickyWrapper>

      <FeedWrapper>
        <div className="flex w-full flex-col items-center">
          <Image
            src="/leaderboard.svg"
            alt="Leaderboard"
            height={90}
            width={90}
          />

          <h1 className="my-6 text-center text-2xl font-bold text-sahel">
            {t.navLeaderboard}
          </h1>
          <p className="mb-6 text-center text-lg text-muted-foreground">
            {t.leaderboardSubtitle}
          </p>

          <Separator className="mb-4 h-0.5 rounded-full" />
          {leaderboard.map((userProgress, i) => (
            <div
              key={userProgress.userId}
              className="flex w-full items-center rounded-xl p-2 px-4 hover:bg-gray-200/50"
            >
              <p
                className={`mr-4 font-bold ${
                  i < 3 ? "text-gold" : i < 10 ? "text-sahel" : "text-muted-foreground"
                }`}
              >
                {i + 1}
              </p>

              <Avatar className="ml-3 mr-6 h-12 w-12 border bg-mangrove">
                <AvatarImage
                  src={userProgress.userImageSrc}
                  className="object-cover"
                />
              </Avatar>

              <p className="flex-1 font-bold text-neutral-800">
                {userProgress.userName}
              </p>
              <p className="text-muted-foreground">{userProgress.points} XP</p>
            </div>
          ))}
        </div>
      </FeedWrapper>
    </div>
  );
};

export default LeaderboardPage;
