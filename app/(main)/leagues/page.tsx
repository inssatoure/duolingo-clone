import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";

import { FeedWrapper } from "@/components/feed-wrapper";
import { Promo } from "@/components/promo";
import { Quests } from "@/components/quests";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { UserProgress } from "@/components/user-progress";
import {
  getUserProgress,
  getUserSubscription,
  getUserStreak,
} from "@/db/queries";
import { getUserLeague, getWeeklyLeagueRankings } from "@/actions/leagues";

const LeaguesPage = async () => {
  await auth.protect();

  const userProgressData = getUserProgress();
  const userSubscriptionData = getUserSubscription();
  const userStreakData = getUserStreak();
  const userLeagueData = getUserLeague();
  const leagueRankingsData = getWeeklyLeagueRankings();

  const [userProgress, userSubscription, userStreak, userLeague, leagueRankings] =
    await Promise.all([
      userProgressData,
      userSubscriptionData,
      userStreakData,
      userLeagueData,
      leagueRankingsData,
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
            src="/mascot.svg"
            alt="Kumba"
            height={90}
            width={90}
            className="mb-6"
          />

          <h1 className="my-6 text-center text-2xl font-bold text-sahel">
            {userLeague?.name || "Bronze League"}
          </h1>
          <p className="mb-6 text-center text-lg text-muted-foreground">
            Compétis avec d'autres apprenants dans ta ligue hebdomadaire
          </p>

          <Separator className="mb-4 h-0.5 rounded-full" />
          
          {leagueRankings && leagueRankings.length > 0 ? (
            <div className="w-full space-y-2">
              {leagueRankings.map((user) => (
                <div
                  key={user.userId}
                  className={`flex w-full items-center rounded-xl p-2 px-4 ${
                    user.isCurrentUser
                      ? "bg-sahel/10 border-2 border-sahel"
                      : "hover:bg-gray-200/50"
                  }`}
                >
                  <p
                    className={`mr-4 font-bold ${
                      user.rank <= 3
                        ? "text-gold"
                        : user.rank <= 10
                        ? "text-sahel"
                        : "text-muted-foreground"
                    }`}
                  >
                    #{user.rank}
                  </p>

                  <Avatar className="ml-3 mr-6 h-12 w-12 border bg-mangrove">
                    <AvatarImage
                      src={user.userImageSrc}
                      className="object-cover"
                    />
                  </Avatar>

                  <p className="flex-1 font-bold text-neutral-800">
                    {user.userName} {user.isCurrentUser && "(Toi)"}
                  </p>
                  <p className="text-muted-foreground">{user.weeklyXp} XP</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              Aucun classement disponible cette semaine
            </p>
          )}
        </div>
      </FeedWrapper>
    </div>
  );
};

export default LeaguesPage;
