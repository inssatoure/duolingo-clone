/**
 * Generates FR→Jola and EN→Jola course content (units/lessons/SELECT
 * challenges) from seeds/jola-dictionary.json, and merges it into the
 * `courses` array of seeds/wolof-course.json (the file seedCourseContent()
 * reads — kept as-is to avoid touching the seeding pipeline).
 *
 * IMPORTANT: this vocabulary is AI-assembled, not sourced from a native
 * Jola/Jóola speaker or verified dictionary. It MUST be reviewed by a native
 * speaker before real learners rely on it — same caveat as the original
 * Wolof content (see seeds/wolof-course.json meta.note).
 *
 * Run: npx tsx scripts/generate-jola-content.ts
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

type VocabItem = { jola: string; fr: string; en: string; category: string };
type Lang = "fr" | "en";

const jolaVocab = JSON.parse(
  readFileSync(join(process.cwd(), "seeds", "jola-dictionary.json"), "utf-8")
) as VocabItem[];

const CATEGORY_TITLES: Record<string, { fr: string; en: string }> = {
  greetings: { fr: "Salutations", en: "Greetings" },
  numbers: { fr: "Nombres", en: "Numbers" },
  family: { fr: "Famille", en: "Family" },
  food: { fr: "Nourriture", en: "Food" },
  colors: { fr: "Couleurs", en: "Colors" },
  verbs: { fr: "Verbes", en: "Verbs" },
};

const rand = () => Math.random();
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const pickDistractors = (pool: VocabItem[], exclude: VocabItem, n: number): VocabItem[] =>
  shuffle(pool.filter((v) => v.jola !== exclude.jola)).slice(0, n);

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const question = (lang: Lang, item: VocabItem) =>
  lang === "fr"
    ? `Comment dit-on "${item.fr}" en jola ?`
    : `How do you say "${item.en}" in Jola?`;

const buildChallenge = (lang: Lang, item: VocabItem, categoryPool: VocabItem[], order: number) => {
  const distractors = pickDistractors(categoryPool, item, 3);
  const options = shuffle([
    { text: item.jola, correct: true },
    ...distractors.map((d) => ({ text: d.jola, correct: false })),
  ]);
  return {
    type: "SELECT",
    question: question(lang, item),
    order,
    options: options.map((o) => ({ ...o, imageSrc: null, audioSrc: null })),
  };
};

const buildCourse = (lang: Lang) => {
  const byCategory = Object.keys(CATEGORY_TITLES)
    .map((category) => ({
      category,
      items: jolaVocab.filter((v) => v.category === category),
    }))
    .filter((c) => c.items.length > 0);

  const units = byCategory.map((cat, unitIdx) => {
    const lessonGroups = chunk(cat.items, 8);
    const lessons = lessonGroups.map((group, lessonIdx) => ({
      title: CATEGORY_TITLES[cat.category][lang],
      order: lessonIdx + 1,
      challenges: group.map((item, i) => buildChallenge(lang, item, cat.items, i + 1)),
    }));
    return {
      title: CATEGORY_TITLES[cat.category][lang],
      description:
        lang === "fr"
          ? `Apprends le vocabulaire : ${CATEGORY_TITLES[cat.category].fr.toLowerCase()}`
          : `Learn vocabulary: ${CATEGORY_TITLES[cat.category].en.toLowerCase()}`,
      order: unitIdx + 1,
      lessons,
    };
  });

  return {
    course: {
      title: lang === "fr" ? "Jola (depuis le français)" : "Jola (from English)",
      imageSrc: "/sn.svg",
    },
    units,
  };
};

const courseFilePath = join(process.cwd(), "seeds", "wolof-course.json");
const courseFile = JSON.parse(readFileSync(courseFilePath, "utf-8")) as {
  meta?: Record<string, unknown>;
  courses: { course: { title: string; imageSrc: string }; units: unknown[] }[];
};

// Idempotent: drop any previously-generated Jola entries before appending
// fresh ones, so re-running this script doesn't duplicate courses.
courseFile.courses = courseFile.courses.filter(
  (c) => !c.course.title.startsWith("Jola (")
);
courseFile.courses.push(buildCourse("fr"), buildCourse("en"));

writeFileSync(courseFilePath, JSON.stringify(courseFile, null, 2) + "\n");

const jolaCourses = courseFile.courses.filter((c) => c.course.title.startsWith("Jola ("));
console.log(
  "Added",
  jolaCourses.length,
  "Jola course(s),",
  jolaVocab.length,
  "vocab items across",
  Object.keys(CATEGORY_TITLES).length,
  "categories."
);
