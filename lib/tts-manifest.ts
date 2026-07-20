import { QUESTS } from "@/constants";
import { DICT } from "@/lib/i18n";
import courseData from "@/seeds/wolof-course.json";

export type TtsItem = {
  text: string;
  lang: "fr" | "en" | "wo";
  /** Chronological position (unit order * 1000 + lesson order); 0 for
   * interface strings that aren't tied to a specific lesson. */
  lessonOrder: number;
  /** Human label for grouping in the admin UI, e.g. "Unité 1 · Leçon 1". */
  lessonLabel: string;
};

interface SeedOption {
  text: string;
}
interface SeedChallenge {
  type: string;
  question: string;
  options: SeedOption[];
}
interface SeedLesson {
  title: string;
  order: number;
  challenges: SeedChallenge[];
}
interface SeedUnit {
  title: string;
  order: number;
  lessons: SeedLesson[];
}
interface SeedCourseEntry {
  course: { title: string };
  units: SeedUnit[];
}

const INTERFACE_LABEL = "Textes de l'interface (menus, boutons)";

/**
 * Every FR/EN/WO string a voice could usefully read, tagged with its
 * position in the actual lesson sequence (unit -> lesson -> challenge) so
 * generation can be prioritized chronologically: whatever the learner hits
 * first (Unit 1, Lesson 1) gets audio first. Interface strings (buttons,
 * menus) aren't tied to a lesson and sort last.
 *
 * Wolof words come from the "toWolof" courses' SELECT options (the wolof
 * word itself) and ASSIST question (also the wolof word); French/English
 * come from that course's SELECT question sentence and ASSIST options (the
 * translations/distractors).
 */
export const buildTtsManifest = (): TtsItem[] => {
  const seen = new Set<string>();
  const items: TtsItem[] = [];
  const add = (
    text: string | undefined | null,
    lang: "fr" | "en" | "wo",
    lessonOrder: number,
    lessonLabel: string
  ) => {
    const trimmed = text?.trim();
    if (!trimmed) return;
    const key = `${lang}:${trimmed.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ text: trimmed, lang, lessonOrder, lessonLabel });
  };

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
    if (!lang) continue; // "ci wolof" courses have Wolof-language prompts, skip for FR/EN/WO manifest

    for (const unit of entry.units) {
      for (const lesson of unit.lessons) {
        const lessonOrder = unit.order * 1000 + lesson.order;
        const lessonLabel = `Unité ${unit.order} · ${lesson.title}`;

        for (const challenge of lesson.challenges) {
          if (challenge.type === "SELECT") {
            // Question is the full "Comment dit-on X en wolof ?" sentence;
            // options are all Wolof words.
            add(challenge.question, lang, lessonOrder, lessonLabel);
            for (const option of challenge.options)
              add(option.text, "wo", lessonOrder, lessonLabel);
          } else {
            // ASSIST: question is the Wolof word; options are the
            // translation (correct) + distractors, all in `lang`.
            add(challenge.question, "wo", lessonOrder, lessonLabel);
            for (const option of challenge.options)
              add(option.text, lang, lessonOrder, lessonLabel);
          }
        }
      }
    }
  }

  // Fixed UI strings (skip interpolation placeholders, added below with
  // concrete values from QUESTS) - not tied to a lesson, sort after content.
  const uiOrder = Number.MAX_SAFE_INTEGER;
  for (const [key, value] of Object.entries(DICT.fr)) {
    if (key === "earnXp") continue;
    add(value, "fr", uiOrder, INTERFACE_LABEL);
  }
  for (const [key, value] of Object.entries(DICT.en)) {
    if (key === "earnXp") continue;
    add(value, "en", uiOrder, INTERFACE_LABEL);
  }
  for (const quest of QUESTS) {
    add(DICT.fr.earnXp.replace("{n}", String(quest.value)), "fr", uiOrder, INTERFACE_LABEL);
    add(DICT.en.earnXp.replace("{n}", String(quest.value)), "en", uiOrder, INTERFACE_LABEL);
  }

  return items.sort((a, b) => a.lessonOrder - b.lessonOrder);
};
