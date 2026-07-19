"use client";

import { useSyncExternalStore } from "react";

import { DICT, LOCALE_COOKIE, isLocale, type Dict, type Locale } from "@/lib/i18n";

export const readLocaleCookie = (): Locale | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${LOCALE_COOKIE}=`));
  const value = match?.split("=")[1];
  return isLocale(value) ? value : null;
};

const listeners = new Set<() => void>();

export const writeLocaleCookie = (locale: Locale) => {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  listeners.forEach((l) => l());
};

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
};

const getSnapshot = (): Locale => readLocaleCookie() ?? "fr";
const getServerSnapshot = (): Locale => "fr";

/** Client-side locale, kept in a cookie so server components see it too. */
export const useLocale = (): { locale: Locale; t: Dict } => {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { locale, t: DICT[locale] };
};
