"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { links } from "@/config";
import { type Locale } from "@/lib/i18n";
import { writeLocaleCookie, writeTargetCookie } from "@/lib/use-locale";

const tracks: {
  flag: string;
  label: string;
  locale: Locale;
  target: "fr" | "en" | null;
}[] = [
  { flag: "/fr.svg", label: "Wolof depuis le français", locale: "fr", target: null },
  { flag: "/sn.svg", label: "Wolof from English", locale: "en", target: null },
  { flag: "/sn.svg", label: "Français ci wolof", locale: "wo", target: "fr" },
  { flag: "/sn.svg", label: "English ci wolof", locale: "wo", target: "en" },
];

export const Footer = () => {
  const router = useRouter();

  const goToCourse = (track: (typeof tracks)[number]) => {
    writeLocaleCookie(track.locale);
    if (track.target) writeTargetCookie(track.target);
    router.push("/courses");
  };

  return (
    <div className="hidden w-full border-t-2 border-slate-200 p-2 lg:block">
      <div className="mx-auto flex h-16 max-w-screen-lg items-center justify-evenly">
        {tracks.map((track) => (
          <Button
            key={track.label}
            size="lg"
            variant="ghost"
            className="w-full"
            onClick={() => goToCourse(track)}
          >
            <Image
              src={track.flag}
              alt=""
              height={32}
              width={40}
              className="mr-4 rounded-md"
            />
            {track.label}
          </Button>
        ))}
      </div>

      <div className="mx-auto flex max-w-screen-lg items-center justify-center gap-x-4 pb-2 text-sm text-muted-foreground">
        <span>
          Créé par{" "}
          <Link
            href={links.website}
            target="_blank"
            rel="noreferrer noopener"
            className="font-semibold text-sahel hover:underline"
          >
            Issa Touré
          </Link>
        </span>
        <Link
          href={links.linkedin}
          target="_blank"
          rel="noreferrer noopener"
          className="hover:underline"
        >
          LinkedIn
        </Link>
        <Link
          href={links.instagram}
          target="_blank"
          rel="noreferrer noopener"
          className="hover:underline"
        >
          Instagram
        </Link>
      </div>
    </div>
  );
};
