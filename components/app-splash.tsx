"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const VISIBLE_MS = 500;
const FADE_MS = 300;

/**
 * Covers the brief blank/black gap between first paint and the app shell
 * being ready (fonts, Clerk, hydration) with the mascot logo instead of an
 * empty screen, especially noticeable on first PWA launch.
 */
export const AppSplash = () => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), VISIBLE_MS);
    const removeTimer = setTimeout(() => setVisible(false), VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
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
        src="/mascot.png"
        alt=""
        height={96}
        width={96}
        priority
        className="animate-bounce"
      />
    </div>
  );
};
