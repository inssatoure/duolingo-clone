import Image from "next/image";

type StreakDisplayProps = {
  currentStreak: number;
  longestStreak: number;
  streakFreezeActive?: boolean;
};

export const StreakDisplay = ({
  currentStreak,
  longestStreak,
  streakFreezeActive = false,
}: StreakDisplayProps) => {
  return (
    <div className="flex items-center gap-x-3 rounded-xl border-2 border-sahel/20 bg-sand/50 p-4">
      <div className="relative">
        <Image
          src="/mascot.svg"
          alt="Kumba"
          width={48}
          height={48}
          className="h-12 w-12"
        />
        {currentStreak > 0 && (
          <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-sahel text-xs font-bold text-white">
            {currentStreak}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-y-1">
        <div className="flex items-center gap-x-2">
          <span className="text-sm font-bold text-sahel">Série actuelle</span>
          {streakFreezeActive && (
            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-semibold text-gold">
              ❄️ Gel
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Record: <span className="font-semibold text-mangrove">{longestStreak} jours</span>
        </p>
      </div>
    </div>
  );
};
