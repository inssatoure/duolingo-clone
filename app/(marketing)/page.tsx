import {
  ClerkLoaded,
  ClerkLoading,
  SignInButton,
  SignUpButton,
  Show,
} from "@clerk/nextjs";
import { Loader } from "lucide-react";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";

import { Onboarding } from "@/components/onboarding";
import { Button } from "@/components/ui/button";
import { DICT, LOCALE_COOKIE, isLocale } from "@/lib/i18n";

export default async function MarketingPage() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : "fr";
  const t = DICT[locale];

  return (
    <div className="mx-auto flex w-full max-w-[988px] flex-1 flex-col items-center justify-center gap-2 p-4 lg:flex-row">
      <Onboarding />

      <div className="relative mb-8 h-[240px] w-[240px] lg:mb-0 lg:h-[424px] lg:w-[424px]">
        <Image src="/hero.svg" alt="Hero" fill />
      </div>

      <div className="flex flex-col items-center gap-y-8">
        <div className="flex flex-col items-center gap-y-2">
          <h1 className="max-w-[480px] text-center text-xl font-bold text-sahel lg:text-3xl">
            {t.heroTitle}
          </h1>
          <p className="max-w-[480px] text-center text-muted-foreground">
            {t.heroSubtitle}
          </p>
        </div>

        <div className="flex w-full max-w-[330px] flex-col items-center gap-y-3">
          <ClerkLoading>
            <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
          </ClerkLoading>

          <ClerkLoaded>
            <Show when="signed-in">
              <Button size="lg" variant="secondary" className="w-full" asChild>
                <Link href="/learn" prefetch>
                  {t.continueLearning}
                </Link>
              </Button>
            </Show>

            <Show when="signed-out">
              <SignUpButton mode="modal">
                <Button size="lg" variant="secondary" className="w-full">
                  {t.getStarted}
                </Button>
              </SignUpButton>

              <SignInButton mode="modal">
                <Button size="lg" variant="primaryOutline" className="w-full">
                  {t.haveAccount}
                </Button>
              </SignInButton>
            </Show>
          </ClerkLoaded>
        </div>
      </div>
    </div>
  );
}
