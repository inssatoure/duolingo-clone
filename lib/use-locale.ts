"use client";

import { useSyncExternalStore } from "react";

import {
  DICT,
  LEARN_COOKIE,
  LOCALE_COOKIE,
  TARGET_COOKIE,
  isLocale,
  type Dict,
  type Locale,
  type LearnLanguage,
} from "@/lib/i18n";

export const readLocaleCookie = (): Locale | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${LOCALE_COOKIE}=`));
  const value = match?.split("=")[1];
  return isLocale(value) ? value : null;
};

export const readTargetCookie = (): "fr" | "en" | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${TARGET_COOKIE}=`));
  const value = match?.split("=")[1];
  return value === "fr" || value === "en" ? value : null;
};

export const writeTargetCookie = (target: "fr" | "en") => {
  document.cookie = `${TARGET_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
};

export const readLearnCookie = (): LearnLanguage => {
  if (typeof document === "undefined") return "wolof";
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${LEARN_COOKIE}=`));
  const value = match?.split("=")[1];
  return value === "jola" ? "jola" : "wolof";
};

export const writeLearnCookie = (learn: LearnLanguage) => {
  document.cookie = `${LEARN_COOKIE}=${learn}; path=/; max-age=31536000; samesite=lax`;
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
