"use client";

import { useState } from "react";

import Image from "next/image";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { QUESTS } from "@/constants";
import { type Dict } from "@/lib/i18n";

type LeagueRanking = {
  userId: string;
  userName: string;
  userImageSrc: string;
  rank: number;
  weeklyXp: number;
  isCurrentUser: boolean;
};
type TopUser = { userId: string; userName: string; userImageSrc: string; points: number };

type SocialTabsProps = {
  t: Dict;
  leagueName: string;
  leagueRankings: LeagueRanking[];
  leaderboard: TopUser[];
  points: number;
};

type Tab = "leagues" | "leaderboard" | "quests";

export const SocialTabs = ({
  t,
  leagueName,
  leagueRankings,
  leaderboard,
  points,
}: SocialTabsProps) => {
  const [tab, setTab] = useState<Tab>("leagues");

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "leagues", label: t.navLeagues, icon: "/icon-leagues.svg" },
    { key: "leaderboard", label: t.navLeaderboard, icon: "/leaderboard.svg" },
    { key: "quests", label: t.navQuests, icon: "/quests.svg" },
  ];

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-6 flex w-full max-w-md rounded-xl border-2 p-1">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`flex flex-1 items-center justify-center gap-x-2 rounded-lg py-2 text-sm font-bold transition ${
              tab === tb.key
                ? "bg-sahel text-white"
                : "text-neutral-500 hover:bg-slate-100"
            }`}
          >
            <Image src={tb.icon} alt="" height={18} width={18} />
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "leagues" && (
        <>
          <Image src="/mascot.png" alt="" height={90} width={90} className="mb-4" />
          <h1 className="my-2 text-center text-2xl font-bold text-sahel">
            {leagueName}
          </h1>
          <p className="mb-6 text-center text-lg text-muted-foreground">
            Compétis avec d&apos;autres apprenants dans ta ligue hebdomadaire
          </p>
          <Separator className="mb-4 h-0.5 rounded-full" />
          {leagueRankings.length > 0 ? (
            <div className="w-full space-y-2">
              {leagueRankings.map((user) => (
                <div
                  key={user.userId}
                  className={`flex w-full items-center rounded-xl p-2 px-4 ${
                    user.isCurrentUser
                      ? "border-2 border-sahel bg-sahel/10"
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
                    <AvatarImage src={user.userImageSrc} className="object-cover" />
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
        </>
      )}

      {tab === "leaderboard" && (
        <>
          <Image src="/leaderboard.svg" alt="" height={90} width={90} />
          <h1 className="my-6 text-center text-2xl font-bold text-sahel">
            {t.navLeaderboard}
          </h1>
          <p className="mb-6 text-center text-lg text-muted-foreground">
            {t.leaderboardSubtitle}
          </p>
          <Separator className="mb-4 h-0.5 rounded-full" />
          <div className="w-full space-y-2">
            {leaderboard.map((user, i) => (
              <div
                key={user.userId}
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
                  <AvatarImage src={user.userImageSrc} className="object-cover" />
                </Avatar>
                <p className="flex-1 font-bold text-neutral-800">{user.userName}</p>
                <p className="text-muted-foreground">{user.points} XP</p>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "quests" && (
        <>
          <Image src="/quests.svg" alt="" height={90} width={90} />
          <h1 className="my-6 text-center text-2xl font-bold text-neutral-800">
            {t.questsWidget}
          </h1>
          <p className="mb-6 text-center text-lg text-muted-foreground">
            {t.questsSubtitle}
          </p>
          <ul className="w-full">
            {QUESTS.map((quest) => {
              const progress = (points / quest.value) * 100;
              return (
                <div className="flex w-full items-center gap-x-4 border-t-2 p-4" key={quest.title}>
                  <Image src="/points.svg" alt="" width={60} height={60} />
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
        </>
      )}
    </div>
  );
};
