import { QUESTS } from "@/constants";
import { DICT } from "@/lib/i18n";
import dictionaryData from "@/seeds/dictionary.json";
import courseData from "@/seeds/wolof-course.json";

export type TtsItem = { text: string; lang: "fr" | "en" | "wo" };

interface SeedCourseEntry {
  course: { title: string };
  units: {
    lessons: { challenges: { type: string; question: string }[] }[];
  }[];
}

/** Every FR/EN string a TTS voice could usefully read: dictionary words,
 * fixed UI strings, and full SELECT-challenge question sentences from the
 * two "toWolof" courses (their prompts are entirely French/English). */
export const buildTtsManifest = (): TtsItem[] => {
  const seen = new Set<string>();
  const items: TtsItem[] = [];
  const add = (text: string | undefined | null, lang: "fr" | "en" | "wo") => {
    const trimmed = text?.trim();
    if (!trimmed) return;
    const key = `${lang}:${trimmed.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ text: trimmed, lang });
  };

  // Dictionary words
  for (const entry of dictionaryData as { wolof: string; fr: string; en: string }[]) {
    add(entry.fr, "fr");
    add(entry.en, "en");
    // Experimental: Google's Chirp3-HD "Autonoe" voice has usable Wolof
    // coverage. A native recording (Studio) always takes priority over this
    // if the same word is later recorded by hand.
    add(entry.wolof, "wo");
  }

  // Fixed UI strings (skip interpolation placeholders, added below with
  // concrete values from QUESTS)
  for (const [key, value] of Object.entries(DICT.fr)) {
    if (key === "earnXp") continue;
    add(value, "fr");
  }
  for (const [key, value] of Object.entries(DICT.en)) {
    if (key === "earnXp") continue;
    add(value, "en");
  }
  for (const quest of QUESTS) {
    add(DICT.fr.earnXp.replace("{n}", String(quest.value)), "fr");
    add(DICT.en.earnXp.replace("{n}", String(quest.value)), "en");
  }

  // Full SELECT-challenge question sentences from the two "toWolof" courses
  const entries = (
    courseData as unknown as { courses: SeedCourseEntry[] }
  ).courses;
  for (const entry of entries) {
    const title = entry.course.title.toLowerCase();
    const lang: "fr" | "en" | null = title.includes("depuis le français")
      ? "fr"
      : title.includes("from english")
        ? "en"
        : null;
    if (!lang) continue; // "ci wolof" courses have Wolof-language prompts
    for (const unit of entry.units) {
      for (const lesson of unit.lessons) {
        for (const challenge of lesson.challenges) {
          if (challenge.type === "SELECT") add(challenge.question, lang);
        }
      }
    }
  }

  return items;
};
