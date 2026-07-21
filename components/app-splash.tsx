"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const MIN_VISIBLE_MS = 600; // avoid a jarring flash if the page is already ready
const MAX_VISIBLE_MS = 4000; // never block the app forever if "load" never fires
const FADE_MS = 300;

/**
 * Covers the brief blank/black gap between first paint and the app shell
 * being ready (fonts, Clerk, hydration) with the full logo instead of an
 * empty/black screen — especially noticeable on first PWA launch. Uses the
 * full PNG logo (logo-full.png), not the small mascot icon or an SVG trace.
 * Stays up until the window "load" event fires (or MAX_VISIBLE_MS, whichever
 * is first) so it also covers slow page loads, not just a fixed timer.
 */
export const AppSplash = () => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const start = Date.now();
    let started = false;
    let fadeTimer: ReturnType<typeof setTimeout>;
    let removeTimer: ReturnType<typeof setTimeout>;

    const beginFade = () => {
      if (started) return;
      started = true;
      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      fadeTimer = setTimeout(() => {
        setFading(true);
        removeTimer = setTimeout(() => setVisible(false), FADE_MS);
      }, wait);
    };

    if (document.readyState === "complete") {
      beginFade();
    } else {
      window.addEventListener("load", beginFade, { once: true });
    }
    const maxTimer = setTimeout(beginFade, MAX_VISIBLE_MS);

    return () => {
      window.removeEventListener("load", beginFade);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
      clearTimeout(maxTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-300 ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <Image
        src="/logo-full.png"
        alt=""
        height={174}
        width={160}
        priority
        className="animate-bounce"
      />
    </div>
  );
};
