"use client";

import {
  ClerkLoaded,
  ClerkLoading,
  SignInButton,
  Show,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import { Loader } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { links } from "@/config";
import { useLocale, writeLocaleCookie } from "@/lib/use-locale";

export const Header = () => {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const { locale, t } = useLocale();

  const toggleLocale = () => {
    const next = locale === "fr" ? "en" : locale === "en" ? "wo" : "fr";
    writeLocaleCookie(next);
    router.refresh();
  };

  return (
    <>
      <header className="h-20 w-full border-b-2 border-slate-200 px-4">
        <div className="mx-auto flex h-full items-center justify-between lg:max-w-screen-lg">
          <Link
            href="/"
            prefetch
            className="flex items-center gap-x-3 pb-7 pl-4 pt-8"
          >
            <Image src="/mascot.svg" alt="Mascot" height={40} width={40} />

            <h1 className="text-2xl font-extrabold tracking-wide text-sahel">
              WoLingo
            </h1>
          </Link>

          <div className="flex items-center gap-x-3">
            <button
              onClick={toggleLocale}
              className="rounded-xl border-2 border-b-4 border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-neutral-600 transition hover:bg-slate-50 active:border-b-2"
              title="FR / EN / WO"
            >
              {locale === "fr" ? "🇫🇷 FR" : locale === "en" ? "🇬🇧 EN" : "🇸🇳 WO"}
            </button>

            <ClerkLoading>
              <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
            </ClerkLoading>
            <ClerkLoaded>
              <Show when="signed-in">
                <UserButton />
              </Show>

              <Show when="signed-out">
                <SignInButton mode="modal">
                  <Button size="lg" variant="ghost">
                    {t.login}
                  </Button>
                </SignInButton>
              </Show>

              <Link
                href={links.sourceCode}
                target="_blank"
                rel="noreferrer noopener"
                className={isSignedIn ? "pt-1.5" : "pt-3"}
              >
                <Image
                  src="/github.svg"
                  alt="Source Code"
                  height={20}
                  width={20}
                />
              </Link>
            </ClerkLoaded>
          </div>
        </div>
      </header>
    </>
  );
};
