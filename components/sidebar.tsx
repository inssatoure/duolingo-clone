import { ClerkLoading, ClerkLoaded, UserButton } from "@clerk/nextjs";
import { Loader } from "lucide-react";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";

import { getIsAdmin } from "@/lib/admin";
import { DICT, LOCALE_COOKIE, isLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { SidebarItem } from "./sidebar-item";

type SidebarProps = {
  className?: string;
};

export const Sidebar = async ({ className }: SidebarProps) => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const t = DICT[isLocale(cookieLocale) ? cookieLocale : "fr"];
  const isAdmin = await getIsAdmin();

  return (
    <div
      className={cn(
        "left-0 top-0 flex h-full flex-col border-r-2 px-4 lg:fixed lg:w-[256px]",
        className
      )}
    >
      <Link href="/learn" prefetch>
        <div className="flex items-center gap-x-3 pb-7 pl-4 pt-8">
          <Image src="/mascot.svg" alt="Mascot" height={40} width={40} />

          <h1 className="text-2xl font-extrabold tracking-wide text-green-600">
            WolofLingo
          </h1>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-y-2">
        <SidebarItem label={t.navLearn} href="/learn" iconSrc="/learn.svg" />
        <SidebarItem
          label={t.navDictionary}
          href="/dictionary"
          iconSrc="/icon-dictionary.svg"
        />
        <SidebarItem
          label={t.navLeaderboard}
          href="/leaderboard"
          iconSrc="/leaderboard.svg"
        />
        <SidebarItem
          label={t.navLeagues}
          href="/leagues"
          iconSrc="/icon-leagues.svg"
        />
        <SidebarItem label={t.navQuests} href="/quests" iconSrc="/quests.svg" />
        <SidebarItem label={t.navShop} href="/shop" iconSrc="/shop.svg" />
        <SidebarItem
          label={t.navCourses}
          href="/courses"
          iconSrc="/icon-courses.svg"
        />
        {isAdmin && (
          <SidebarItem
            label={t.navAdmin}
            href="/admin"
            iconSrc="/icon-admin.svg"
          />
        )}
      </div>

      <div className="p-4">
        <ClerkLoading>
          <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
        </ClerkLoading>

        <ClerkLoaded>
          <UserButton
            appearance={{
              elements: { userButtonPopoverCard: { pointerEvents: "initial" } },
            }}
          />
        </ClerkLoaded>
      </div>
    </div>
  );
};
