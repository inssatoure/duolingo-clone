import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { FeedWrapper } from "@/components/feed-wrapper";
import { Quests } from "@/components/quests";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { UserProgress } from "@/components/user-progress";
import { getUserProgress, getUserSubscription, getUserStreak } from "@/db/queries";
import { DICT, LOCALE_COOKIE, isLocale } from "@/lib/i18n";

import { Items } from "./items";

const ShopPage = async () => {
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

        <Quests points={userProgress.points} />
      </StickyWrapper>

      <FeedWrapper>
        <div className="flex w-full flex-col items-center">
          <Image src="/shop.svg" alt="Shop" height={90} width={90} />

          <h1 className="my-6 text-center text-2xl font-bold text-sahel">
            {t.navShop}
          </h1>
          <p className="mb-6 text-center text-lg text-muted-foreground">
            {t.shopSubtitle}
          </p>

          <Items
            hearts={userProgress.hearts}
            points={userProgress.points}
            hasActiveSubscription={isPro}
            cfaBalance={userProgress.cfaBalance || 0}
          />
        </div>
      </FeedWrapper>
    </div>
  );
};

export default ShopPage;
