import { InfinityIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { courses } from "@/db/schema";
import { StreakDisplay } from "./streak-display";

type UserProgressProps = {
  activeCourse: typeof courses.$inferSelect;
  hearts: number;
  points: number;
  hasActiveSubscription: boolean;
  currentStreak?: number;
  longestStreak?: number;
  streakFreezeActive?: boolean;
  cfaBalance?: number;
};

export const UserProgress = ({
  activeCourse,
  hearts,
  points,
  hasActiveSubscription,
  currentStreak = 0,
  longestStreak = 0,
  streakFreezeActive = false,
  cfaBalance = 0,
}: UserProgressProps) => {
  return (
    <div className="flex w-full flex-col gap-y-4">
      <div className="flex w-full items-center justify-between gap-x-2">
        <Link href="/courses" prefetch>
          <Button variant="ghost">
            <Image
              src={activeCourse.imageSrc}
              alt={activeCourse.title}
              className="rounded-md border"
              width={32}
              height={32}
            />
          </Button>
        </Link>

        <Link href="/shop" prefetch>
          <Button variant="ghost" className="text-sahel">
            <Image
              src="/points.svg"
              height={28}
              width={28}
              alt="XP"
              className="mr-2"
            />
            {points} XP
          </Button>
        </Link>

        <Link href="/shop" prefetch>
          <Button variant="ghost" className="text-rose-500">
            <Image
              src="/heart.svg"
              height={22}
              width={22}
              alt="Hearts"
              className="mr-2"
            />
            {hasActiveSubscription ? (
              <InfinityIcon className="stroke-3 h-4 w-4" />
            ) : (
              hearts
            )}
          </Button>
        </Link>

        <Link href="/shop" prefetch>
          <Button variant="ghost" className="text-gold">
            <Image
              src="/points.svg"
              height={28}
              width={28}
              alt="CFA"
              className="mr-2"
            />
            {cfaBalance} CFA
          </Button>
        </Link>
      </div>

      <StreakDisplay
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        streakFreezeActive={streakFreezeActive}
      />
    </div>
  );
};
