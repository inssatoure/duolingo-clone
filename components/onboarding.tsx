"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { type Locale } from "@/lib/i18n";
import {
  readLocaleCookie,
  writeLocaleCookie,
  writeTargetCookie,
} from "@/lib/use-locale";

type Step = "hidden" | "splash" | "pick" | "pickTarget" | "ready";

/**
 * First-visit onboarding: quick animated splash, then a Duolingo-style
 * "what's your language?" picker that sets the UI locale for the whole app.
 */
export const Onboarding = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>("hidden");
  const [picked, setPicked] = useState<Locale | null>(null);

  useEffect(() => {
    if (readLocaleCookie()) return;
    const showSplash = setTimeout(() => setStep("splash"), 0);
    const showPicker = setTimeout(() => setStep("pick"), 1100);
    return () => {
      clearTimeout(showSplash);
      clearTimeout(showPicker);
    };
  }, []);

  const finish = () => {
    setStep("ready");
    setTimeout(() => {
      setStep("hidden");
      router.refresh();
    }, 1600);
  };

  const choose = (locale: Locale) => {
    if (picked) return;
    setPicked(locale);
    writeLocaleCookie(locale);
    if (locale === "wo") {
      // Wolof speakers pick which language they want to learn next.
      setStep("pickTarget");
      return;
    }
    finish();
  };

  const chooseTarget = (target: "fr" | "en") => {
    writeTargetCookie(target);
    finish();
  };

  if (step === "hidden") return null;

  const isEn = picked === "en";
  const isWo = picked === "wo";

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-[#fff7ed] px-6 transition-opacity duration-500"
      aria-modal
      role="dialog"
    >
      {step === "splash" && (
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/mascot.svg"
            alt="WolofLingo"
            height={120}
            width={120}
            className="animate-bounce"
            priority
          />
          <h1 className="animate-pulse text-4xl font-extrabold tracking-wide text-sahel">
            WolofLingo
          </h1>
          <p className="text-lg font-semibold text-muted-foreground">
            Salaamaalekum ! 👋
          </p>
        </div>
      )}

      {step === "pick" && (
        <div className="flex w-full max-w-md flex-col items-center gap-6 duration-500 animate-in fade-in slide-in-from-bottom-4">
          <Image src="/mascot.svg" alt="" height={80} width={80} priority />

          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-sahel lg:text-3xl">
              Quelle est ta langue ?
            </h1>
            <h2 className="mt-1 text-xl font-bold text-muted-foreground lg:text-2xl">
              What&apos;s your language?
            </h2>
          </div>

          <div className="flex w-full flex-col gap-4">
            <button
              onClick={() => choose("fr")}
              className="group flex items-center gap-4 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-5 text-left transition hover:scale-[1.02] hover:border-sky-300 hover:bg-sky-50 active:border-b-2"
            >
              <Image
                src="/fr.svg"
                alt="Français"
                height={40}
                width={54}
                className="rounded-md shadow-sm"
              />
              <span>
                <span className="block text-lg font-bold text-neutral-700">
                  Français
                </span>
                <span className="block text-sm text-muted-foreground">
                  J&apos;apprends le wolof depuis le français
                </span>
              </span>
              <span className="ml-auto text-2xl transition group-hover:translate-x-1">
                →
              </span>
            </button>

            <button
              onClick={() => choose("en")}
              className="group flex items-center gap-4 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-5 text-left transition hover:scale-[1.02] hover:border-rose-300 hover:bg-rose-50 active:border-b-2"
            >
              <span className="flex h-[40px] w-[54px] items-center justify-center rounded-md bg-slate-100 text-2xl shadow-sm">
                🇬🇧
              </span>
              <span>
                <span className="block text-lg font-bold text-neutral-700">
                  English
                </span>
                <span className="block text-sm text-muted-foreground">
                  I&apos;m learning Wolof from English
                </span>
              </span>
              <span className="ml-auto text-2xl transition group-hover:translate-x-1">
                →
              </span>
            </button>
            <button
              onClick={() => choose("wo")}
              className="group flex items-center gap-4 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-5 text-left transition hover:scale-[1.02] hover:border-green-300 hover:bg-green-50 active:border-b-2"
            >
              <Image
                src="/sn.svg"
                alt="Wolof"
                height={40}
                width={54}
                className="rounded-md shadow-sm"
              />
              <span>
                <span className="block text-lg font-bold text-neutral-700">
                  Wolof
                </span>
                <span className="block text-sm text-muted-foreground">
                  Dégg naa wolof, bëgg naa jàng farañse walla angale
                </span>
              </span>
              <span className="ml-auto text-2xl transition group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            🇸🇳 Wolof, français, English — WolofLingo dina la jàppale !
          </p>
        </div>
      )}

      {step === "pickTarget" && (
        <div className="flex w-full max-w-md flex-col items-center gap-6 duration-500 animate-in fade-in slide-in-from-bottom-4">
          <Image src="/mascot.svg" alt="" height={80} width={80} priority />

          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-sahel lg:text-3xl">
              Lan nga bëgg jàng ?
            </h1>
            <h2 className="mt-1 text-lg font-bold text-muted-foreground">
              Tannal làkk bi nga bëgg jàng
            </h2>
          </div>

          <div className="flex w-full flex-col gap-4">
            <button
              onClick={() => chooseTarget("fr")}
              className="group flex items-center gap-4 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-5 text-left transition hover:scale-[1.02] hover:border-sky-300 hover:bg-sky-50 active:border-b-2"
            >
              <Image
                src="/fr.svg"
                alt="Français"
                height={40}
                width={54}
                className="rounded-md shadow-sm"
              />
              <span>
                <span className="block text-lg font-bold text-neutral-700">
                  Farañse
                </span>
                <span className="block text-sm text-muted-foreground">
                  Jàng français ci wolof
                </span>
              </span>
              <span className="ml-auto text-2xl transition group-hover:translate-x-1">
                →
              </span>
            </button>

            <button
              onClick={() => chooseTarget("en")}
              className="group flex items-center gap-4 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-5 text-left transition hover:scale-[1.02] hover:border-rose-300 hover:bg-rose-50 active:border-b-2"
            >
              <Image
                src="/gb.svg"
                alt="English"
                height={40}
                width={54}
                className="rounded-md shadow-sm"
              />
              <span>
                <span className="block text-lg font-bold text-neutral-700">
                  Angale
                </span>
                <span className="block text-sm text-muted-foreground">
                  Jàng English ci wolof
                </span>
              </span>
              <span className="ml-auto text-2xl transition group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>
        </div>
      )}

      {step === "ready" && (
        <div className="flex flex-col items-center gap-4 duration-300 animate-in fade-in zoom-in-90">
          <Image
            src="/mascot.svg"
            alt=""
            height={110}
            width={110}
            className="animate-bounce"
          />
          <h1 className="text-3xl font-extrabold text-sahel">
            {isWo
              ? "Jërëjëf ! Ñu dem 🎉"
              : isEn
                ? "Jërëjëf! Let's go 🎉"
                : "Jërëjëf ! C'est parti 🎉"}
          </h1>
          <p className="text-lg font-semibold text-muted-foreground">
            {isWo
              ? "Ndank-ndank mooy japp golo ci ñaay !"
              : isEn
                ? "Wolof awaits you… Ndank-ndank!"
                : "Le wolof t'attend… Ndank-ndank !"}
          </p>
        </div>
      )}
    </div>
  );
};
