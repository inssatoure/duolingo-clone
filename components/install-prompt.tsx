"use client";

import { useEffect, useState } from "react";

import Image from "next/image";

const DISMISS_KEY = "wolingo-install-dismissed-at";
const DISMISS_DAYS = 14;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const isDismissedRecently = () => {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const days = (Date.now() - Number(raw)) / (1000 * 60 * 60 * 24);
  return days < DISMISS_DAYS;
};

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  // iOS Safari
  (navigator as unknown as { standalone?: boolean }).standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/**
 * Duolingo-style "install this as an app" nudge. The site isn't on an app
 * store yet, so this is the only way to get it onto a home screen:
 * - Android/desktop Chrome: captures the native beforeinstallprompt event
 *   and shows a button that triggers the real install dialog.
 * - iOS Safari: has no such API, so shows manual instructions instead
 *   (Share -> Add to Home Screen).
 */
export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone() || isDismissedRecently()) return;

    const timer = setTimeout(() => {
      setDismissed(false);
      if (isIos()) setShowIosHint(true);
    }, 0);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  };

  if (dismissed || (!deferredPrompt && !showIosHint)) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[90] mx-auto flex max-w-md items-center gap-3 rounded-2xl border-2 bg-white p-4 shadow-lg">
      <Image src="/mascot.png" alt="" height={40} width={40} />
      <div className="flex-1 text-sm">
        <p className="font-bold text-neutral-800">Installe WoLingo</p>
        <p className="text-muted-foreground">
          {showIosHint
            ? "Appuie sur Partager, puis « Sur l'écran d'accueil »."
            : "Ajoute l'appli à ton écran d'accueil pour un accès rapide."}
        </p>
      </div>
      {!showIosHint && (
        <button
          onClick={() => void install()}
          className="shrink-0 rounded-xl bg-sahel px-3 py-2 text-sm font-bold text-white"
        >
          Installer
        </button>
      )}
      <button
        onClick={dismiss}
        className="shrink-0 text-lg text-muted-foreground"
        aria-label="Fermer"
      >
        ✕
      </button>
    </div>
  );
};
