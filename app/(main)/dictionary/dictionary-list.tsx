"use client";

import { useMemo, useState } from "react";

import Image from "next/image";

import { type Locale } from "@/lib/i18n";

export type DictionaryEntry = {
  wolof: string;
  fr: string;
  en: string;
  category: string;
  imageSrc: string | null;
  audioSrc: string | null;
};

const CATEGORY_LABELS: Record<string, { fr: string; en: string; emoji: string }> = {
  greetings: { fr: "Salutations", en: "Greetings", emoji: "👋" },
  family: { fr: "Famille", en: "Family", emoji: "👨‍👩‍👧‍👦" },
  numbers: { fr: "Nombres", en: "Numbers", emoji: "🔢" },
  food: { fr: "Nourriture", en: "Food", emoji: "🍛" },
  colors: { fr: "Couleurs", en: "Colors", emoji: "🎨" },
  objects: { fr: "Objets", en: "Objects", emoji: "🏠" },
  verbs: { fr: "Verbes", en: "Verbs", emoji: "🏃" },
  days: { fr: "Jours et temps", en: "Days & time", emoji: "📅" },
  body: { fr: "Corps", en: "Body", emoji: "🫀" },
  animals: { fr: "Animaux", en: "Animals", emoji: "🦁" },
  places: { fr: "Lieux", en: "Places", emoji: "🏙️" },
  weather: { fr: "Météo et nature", en: "Weather & nature", emoji: "☀️" },
  clothing: { fr: "Vêtements", en: "Clothing", emoji: "👕" },
  pronouns: { fr: "Pronoms", en: "Pronouns", emoji: "🗣️" },
  adjectives: { fr: "Adjectifs", en: "Adjectives", emoji: "✨" },
  phrases: { fr: "Phrases", en: "Phrases", emoji: "💬" },
};

type DictionaryListProps = {
  entries: DictionaryEntry[];
  locale: Locale;
};

export const DictionaryList = ({ entries, locale }: DictionaryListProps) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set(entries.map((e) => e.category))],
    [entries]
  );

  const normalized = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  const filtered = useMemo(() => {
    const q = normalized(search.trim());
    return entries.filter((e) => {
      if (category && e.category !== category) return false;
      if (!q) return true;
      return [e.wolof, e.fr, e.en].some((v) => normalized(v).includes(q));
    });
  }, [entries, search, category]);

  const play = (src: string) => {
    void new Audio(src).play();
  };

  return (
    <div className="mt-6">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={
          locale === "fr"
            ? "Chercher un mot (wolof, français, anglais)…"
            : "Search a word (Wolof, French, English)…"
        }
        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-sky-300"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory(null)}
          className={`rounded-full border-2 px-3 py-1 text-sm font-semibold transition ${
            category === null
              ? "border-sky-400 bg-sky-100 text-sky-700"
              : "border-slate-200 bg-white text-neutral-600 hover:bg-slate-50"
          }`}
        >
          {locale === "fr" ? "Tout" : "All"}
        </button>
        {categories.map((c) => {
          const meta = CATEGORY_LABELS[c];
          return (
            <button
              key={c}
              onClick={() => setCategory(category === c ? null : c)}
              className={`rounded-full border-2 px-3 py-1 text-sm font-semibold transition ${
                category === c
                  ? "border-sky-400 bg-sky-100 text-sky-700"
                  : "border-slate-200 bg-white text-neutral-600 hover:bg-slate-50"
              }`}
            >
              {meta ? `${meta.emoji} ${meta[locale]}` : c}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filtered.map((e) => (
          <div
            key={`${e.category}-${e.wolof}-${e.fr}`}
            className="flex items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-4"
          >
            {e.imageSrc ? (
              <Image
                src={e.imageSrc}
                alt={e.wolof}
                height={56}
                width={56}
                className="rounded-xl"
              />
            ) : (
              <div className="flex h-[56px] w-[56px] items-center justify-center rounded-xl bg-slate-100 text-2xl">
                {CATEGORY_LABELS[e.category]?.emoji ?? "📖"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-extrabold text-neutral-800">
                {e.wolof}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {locale === "fr" ? e.fr : e.en}
              </p>
            </div>
            {e.audioSrc && (
              <button
                onClick={() => play(e.audioSrc!)}
                className="rounded-full border-2 border-slate-200 p-2 text-xl transition hover:bg-sky-50"
                title={locale === "fr" ? "Écouter" : "Listen"}
              >
                🔊
              </button>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-muted-foreground">
          {locale === "fr"
            ? "Aucun mot trouvé… Essaie une autre recherche !"
            : "No words found… Try another search!"}
        </p>
      )}
    </div>
  );
};
