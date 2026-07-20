import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { FeedWrapper } from "@/components/feed-wrapper";
import { Promo } from "@/components/promo";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { Progress } from "@/components/ui/progress";
import { UserProgress } from "@/components/user-progress";
import { QUESTS } from "@/constants";
import { getUserProgress, getUserSubscription, getUserStreak } from "@/db/queries";
import { DICT, LOCALE_COOKIE, isLocale } from "@/lib/i18n";

const QuestsPage = async () => {
  await auth.protect();

  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const t = DICT[isLocale(cookieLocale) ? cookieLocale : "fr"];

  const userProgressData = getUserProgress();
  const userSubscriptionData = getUserSubscription();
  const userStreakData = getUserStreak();

  const [userProgress, userSubscription, userStreak] = await Promise.all([
    userProgressData,
    userSubscriptionData,
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
      </StickyWrapper>

      <FeedWrapper>
        <div className="flex w-full flex-col items-center">
          <Image src="/quests.svg" alt="Quests" height={90} width={90} />

          <h1 className="my-6 text-center text-2xl font-bold text-neutral-800">
            {t.questsWidget}
          </h1>
          <p className="mb-6 text-center text-lg text-muted-foreground">
            {t.questsSubtitle}
          </p>

          <ul className="w-full">
            {QUESTS.map((quest) => {
              const progress = (userProgress.points / quest.value) * 100;

              return (
                <div
                  className="flex w-full items-center gap-x-4 border-t-2 p-4"
                  key={quest.title}
                >
                  <Image
                    src="/points.svg"
                    alt="Points"
                    width={60}
                    height={60}
                  />

                  <div className="flex w-full flex-col gap-y-2">
                    <p className="text-xl font-bold text-neutral-700">
                      {t.earnXp.replace("{n}", String(quest.value))}
                    </p>

                    <Progress value={progress} className="h-3" />
                  </div>
                </div>
              );
            })}
          </ul>
        </div>
      </FeedWrapper>
    </div>
  );
};

export default QuestsPage;
