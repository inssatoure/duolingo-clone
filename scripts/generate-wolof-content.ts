/**
 * Generates seeds/wolof-course.json from a structured Wolof vocabulary
 * dataset. Produces TWO courses that teach the same Wolof content:
 *   - "Wolof (depuis le français)"  -- prompts/questions in French
 *   - "Wolof (from English)"        -- prompts/questions in English
 *
 * Vocabulary is standard, well-attested Wolof (greetings, numbers, family,
 * food, colors, common nouns/verbs, days, everyday phrases). Confidence is
 * tracked per item ("core" = very common/certain, "review" = still standard
 * Wolof but worth a native-speaker double-check on spelling/register).
 *
 * Run with: npx tsx scripts/generate-wolof-content.ts
 */
import { writeFileSync } from "fs";
import { join } from "path";

type Category =
  | "greetings"
  | "family"
  | "numbers"
  | "food"
  | "colors"
  | "verbs"
  | "days"
  | "phrases";

type Confidence = "core" | "review";

interface VocabItem {
  wolof: string;
  fr: string;
  en: string;
  category: Category;
  confidence: Confidence;
  /** Optional illustrative image already available in /public, else null */
  imageSrc?: string | null;
}

// ---------------------------------------------------------------------------
// Vocabulary dataset
// ---------------------------------------------------------------------------
const VOCAB: VocabItem[] = [
  // Greetings & Basics
  { wolof: "Nanga def?", fr: "Comment vas-tu ?", en: "How are you?", category: "greetings", confidence: "core" },
  { wolof: "Maa ngi fi rekk", fr: "Je vais bien", en: "I'm fine", category: "greetings", confidence: "core" },
  { wolof: "Jamm rekk", fr: "Juste la paix (ça va)", en: "Peace only (I'm fine)", category: "greetings", confidence: "core" },
  { wolof: "Dieuredieuf", fr: "Merci", en: "Thank you", category: "greetings", confidence: "core" },
  { wolof: "Ba beneen yoon", fr: "À la prochaine", en: "See you next time", category: "greetings", confidence: "review" },
  { wolof: "Ba suba", fr: "À demain", en: "See you tomorrow", category: "greetings", confidence: "core" },
  { wolof: "Salaam aleekum", fr: "Bonjour (paix sur toi)", en: "Hello (peace be upon you)", category: "greetings", confidence: "core" },
  { wolof: "Maleekum salaam", fr: "Réponse à bonjour", en: "Reply to hello", category: "greetings", confidence: "core" },
  { wolof: "Waaw", fr: "Oui", en: "Yes", category: "greetings", confidence: "core" },
  { wolof: "Deedet", fr: "Non", en: "No", category: "greetings", confidence: "core" },
  { wolof: "Baal ma", fr: "Excuse-moi", en: "Excuse me", category: "greetings", confidence: "core" },
  { wolof: "Naka nga tudd?", fr: "Comment tu t'appelles ?", en: "What's your name?", category: "greetings", confidence: "core" },
  { wolof: "Man, maa ngi tudd...", fr: "Moi, je m'appelle...", en: "My name is...", category: "greetings", confidence: "review" },
  { wolof: "Fan nga dëkk?", fr: "Où habites-tu ?", en: "Where do you live?", category: "greetings", confidence: "review" },
  { wolof: "Ana waa kër ga?", fr: "Comment va la famille ?", en: "How is the family?", category: "greetings", confidence: "review" },

  // Family
  { wolof: "Ndey", fr: "Mère", en: "Mother", category: "family", confidence: "core" },
  { wolof: "Baay", fr: "Père", en: "Father", category: "family", confidence: "core" },
  { wolof: "Rakk", fr: "Petit frère / petite sœur", en: "Younger sibling", category: "family", confidence: "core" },
  { wolof: "Mag", fr: "Grand frère / grande sœur", en: "Older sibling", category: "family", confidence: "core" },
  { wolof: "Jigéen", fr: "Femme / fille", en: "Woman / girl", category: "family", confidence: "core" },
  { wolof: "Góor", fr: "Homme / garçon", en: "Man / boy", category: "family", confidence: "core" },
  { wolof: "Doom", fr: "Enfant", en: "Child", category: "family", confidence: "core" },
  { wolof: "Maam", fr: "Grand-parent", en: "Grandparent", category: "family", confidence: "core" },
  { wolof: "Nijaay", fr: "Oncle maternel", en: "Maternal uncle", category: "family", confidence: "review" },
  { wolof: "Bajjan", fr: "Tante paternelle", en: "Paternal aunt", category: "family", confidence: "review" },
  { wolof: "Jëkkër", fr: "Mari", en: "Husband", category: "family", confidence: "review" },
  { wolof: "Jabar", fr: "Épouse", en: "Wife", category: "family", confidence: "review" },
  { wolof: "Kër", fr: "Maison / famille", en: "Home / family", category: "family", confidence: "core" },

  // Numbers
  { wolof: "Benn", fr: "Un", en: "One", category: "numbers", confidence: "core" },
  { wolof: "Ñaar", fr: "Deux", en: "Two", category: "numbers", confidence: "core" },
  { wolof: "Ñett", fr: "Trois", en: "Three", category: "numbers", confidence: "core" },
  { wolof: "Ñeent", fr: "Quatre", en: "Four", category: "numbers", confidence: "core" },
  { wolof: "Juróom", fr: "Cinq", en: "Five", category: "numbers", confidence: "core" },
  { wolof: "Juróom benn", fr: "Six", en: "Six", category: "numbers", confidence: "core" },
  { wolof: "Juróom ñaar", fr: "Sept", en: "Seven", category: "numbers", confidence: "core" },
  { wolof: "Juróom ñett", fr: "Huit", en: "Eight", category: "numbers", confidence: "core" },
  { wolof: "Juróom ñeent", fr: "Neuf", en: "Nine", category: "numbers", confidence: "core" },
  { wolof: "Fukk", fr: "Dix", en: "Ten", category: "numbers", confidence: "core" },
  { wolof: "Fukk ak benn", fr: "Onze", en: "Eleven", category: "numbers", confidence: "review" },
  { wolof: "Fukk ak ñaar", fr: "Douze", en: "Twelve", category: "numbers", confidence: "review" },
  { wolof: "Fukk ak ñett", fr: "Treize", en: "Thirteen", category: "numbers", confidence: "review" },
  { wolof: "Fukk ak ñeent", fr: "Quatorze", en: "Fourteen", category: "numbers", confidence: "review" },
  { wolof: "Fukk ak juróom", fr: "Quinze", en: "Fifteen", category: "numbers", confidence: "review" },
  { wolof: "Ñaar fukk", fr: "Vingt", en: "Twenty", category: "numbers", confidence: "core" },

  // Food & Drink
  { wolof: "Ceeb", fr: "Riz", en: "Rice", category: "food", confidence: "core" },
  { wolof: "Jën", fr: "Poisson", en: "Fish", category: "food", confidence: "core" },
  { wolof: "Yàpp", fr: "Viande", en: "Meat", category: "food", confidence: "core" },
  { wolof: "Ndox", fr: "Eau", en: "Water", category: "food", confidence: "core" },
  { wolof: "Meew", fr: "Lait", en: "Milk", category: "food", confidence: "core" },
  { wolof: "Attaaya", fr: "Thé", en: "Tea", category: "food", confidence: "core" },
  { wolof: "Mburu", fr: "Pain", en: "Bread", category: "food", confidence: "core" },
  { wolof: "Soow", fr: "Lait caillé", en: "Curdled milk", category: "food", confidence: "review" },
  { wolof: "Ganaar", fr: "Poulet", en: "Chicken", category: "food", confidence: "core" },
  { wolof: "Nen", fr: "Œuf", en: "Egg", category: "food", confidence: "core" },
  { wolof: "Xorom", fr: "Sel", en: "Salt", category: "food", confidence: "review" },
  { wolof: "Sukër", fr: "Sucre", en: "Sugar", category: "food", confidence: "core" },
  { wolof: "Mángo", fr: "Mangue", en: "Mango", category: "food", confidence: "core" },
  { wolof: "Ceebu jën", fr: "Riz au poisson (plat national)", en: "Rice with fish (national dish)", category: "food", confidence: "core" },

  // Colors & Objects
  { wolof: "Weex", fr: "Blanc", en: "White", category: "colors", confidence: "core" },
  { wolof: "Ñuul", fr: "Noir", en: "Black", category: "colors", confidence: "core" },
  { wolof: "Xonq", fr: "Rouge", en: "Red", category: "colors", confidence: "core" },
  { wolof: "Wert", fr: "Vert", en: "Green", category: "colors", confidence: "core" },
  { wolof: "Bulo", fr: "Bleu", en: "Blue", category: "colors", confidence: "review" },
  { wolof: "Mboq", fr: "Jaune", en: "Yellow", category: "colors", confidence: "review" },
  { wolof: "Kër", fr: "Maison", en: "House", category: "colors", confidence: "core" },
  { wolof: "Téere", fr: "Livre", en: "Book", category: "colors", confidence: "core" },
  { wolof: "Xale", fr: "Enfant", en: "Kid", category: "colors", confidence: "review" },
  { wolof: "Oto", fr: "Voiture", en: "Car", category: "colors", confidence: "core" },
  { wolof: "Bunt", fr: "Porte", en: "Door", category: "colors", confidence: "review" },
  { wolof: "Pal", fr: "Chaise", en: "Chair", category: "colors", confidence: "review" },
  { wolof: "Taabal", fr: "Table", en: "Table", category: "colors", confidence: "review" },
  { wolof: "Alal", fr: "Argent / richesse", en: "Money / wealth", category: "colors", confidence: "review" },
  { wolof: "Jën bi", fr: "Le poisson (défini)", en: "The fish (definite)", category: "colors", confidence: "review" },
  { wolof: "Xarit", fr: "Ami(e)", en: "Friend", category: "colors", confidence: "core" },

  // Common Verbs
  { wolof: "Dem", fr: "Aller", en: "To go", category: "verbs", confidence: "core" },
  { wolof: "Ñëw", fr: "Venir", en: "To come", category: "verbs", confidence: "core" },
  { wolof: "Lekk", fr: "Manger", en: "To eat", category: "verbs", confidence: "core" },
  { wolof: "Naan", fr: "Boire", en: "To drink", category: "verbs", confidence: "core" },
  { wolof: "Gis", fr: "Voir", en: "To see", category: "verbs", confidence: "core" },
  { wolof: "Dégg", fr: "Entendre / comprendre", en: "To hear / understand", category: "verbs", confidence: "core" },
  { wolof: "Wax", fr: "Parler", en: "To speak", category: "verbs", confidence: "core" },
  { wolof: "Bind", fr: "Écrire", en: "To write", category: "verbs", confidence: "review" },
  { wolof: "Jàng", fr: "Étudier / lire", en: "To study / read", category: "verbs", confidence: "core" },
  { wolof: "Liggéey", fr: "Travailler", en: "To work", category: "verbs", confidence: "core" },
  { wolof: "Nelaw", fr: "Dormir", en: "To sleep", category: "verbs", confidence: "core" },
  { wolof: "Def", fr: "Faire", en: "To do", category: "verbs", confidence: "core" },
  { wolof: "Bëgg", fr: "Vouloir / aimer", en: "To want / love", category: "verbs", confidence: "core" },
  { wolof: "Am", fr: "Avoir", en: "To have", category: "verbs", confidence: "core" },

  // Days & Time
  { wolof: "Altine", fr: "Lundi", en: "Monday", category: "days", confidence: "core" },
  { wolof: "Talaata", fr: "Mardi", en: "Tuesday", category: "days", confidence: "core" },
  { wolof: "Àllarba", fr: "Mercredi", en: "Wednesday", category: "days", confidence: "core" },
  { wolof: "Alxamis", fr: "Jeudi", en: "Thursday", category: "days", confidence: "core" },
  { wolof: "Àjjuma", fr: "Vendredi", en: "Friday", category: "days", confidence: "core" },
  { wolof: "Gaawu", fr: "Samedi", en: "Saturday", category: "days", confidence: "core" },
  { wolof: "Dibéer", fr: "Dimanche", en: "Sunday", category: "days", confidence: "core" },
  { wolof: "Tey", fr: "Aujourd'hui", en: "Today", category: "days", confidence: "core" },
  { wolof: "Suba", fr: "Demain / matin", en: "Tomorrow / morning", category: "days", confidence: "core" },
  { wolof: "Démb", fr: "Hier", en: "Yesterday", category: "days", confidence: "core" },
  { wolof: "Ngoon", fr: "Après-midi", en: "Afternoon", category: "days", confidence: "review" },
  { wolof: "Guddi", fr: "Nuit", en: "Night", category: "days", confidence: "core" },

  // Everyday Phrases
  { wolof: "Fan la?", fr: "Où est-ce ?", en: "Where is it?", category: "phrases", confidence: "review" },
  { wolof: "Ban jamono la?", fr: "Quelle heure est-il ?", en: "What time is it?", category: "phrases", confidence: "review" },
  { wolof: "Bëgg naa ko", fr: "Je le veux / je l'aime", en: "I want it / I like it", category: "phrases", confidence: "review" },
  { wolof: "Damay dem", fr: "Je m'en vais", en: "I'm going", category: "phrases", confidence: "review" },
  { wolof: "Lu ndëm?", fr: "Qu'est-ce qui se passe ?", en: "What's going on?", category: "phrases", confidence: "review" },
  { wolof: "Waw, baax na", fr: "Oui, c'est bien", en: "Yes, it's good", category: "phrases", confidence: "review" },
  { wolof: "Kañ nga ñëw?", fr: "Quand es-tu arrivé(e) ?", en: "When did you arrive?", category: "phrases", confidence: "review" },
  { wolof: "Ndax dégg nga wolof?", fr: "Est-ce que tu comprends le wolof ?", en: "Do you understand Wolof?", category: "phrases", confidence: "review" },
  { wolof: "Waaw, dégg naa ko tuuti", fr: "Oui, je comprends un peu", en: "Yes, I understand a little", category: "phrases", confidence: "review" },
  { wolof: "Yow nak?", fr: "Et toi ?", en: "And you?", category: "phrases", confidence: "core" },
];

const CATEGORY_META: Record<
  Category,
  { titleFr: string; titleEn: string; descFr: string; descEn: string; order: number }
> = {
  greetings: {
    titleFr: "Salutations et bases",
    titleEn: "Greetings & Basics",
    descFr: "Apprends à saluer et à te présenter en wolof",
    descEn: "Learn to greet people and introduce yourself in Wolof",
    order: 1,
  },
  family: {
    titleFr: "La famille",
    titleEn: "Family",
    descFr: "Le vocabulaire de la famille en wolof",
    descEn: "Family vocabulary in Wolof",
    order: 2,
  },
  numbers: {
    titleFr: "Les nombres",
    titleEn: "Numbers",
    descFr: "Compter de 1 à 20 en wolof",
    descEn: "Count from 1 to 20 in Wolof",
    order: 3,
  },
  food: {
    titleFr: "Nourriture et boissons",
    titleEn: "Food & Drink",
    descFr: "Le vocabulaire de la cuisine sénégalaise",
    descEn: "Vocabulary of Senegalese cuisine",
    order: 4,
  },
  colors: {
    titleFr: "Couleurs et objets",
    titleEn: "Colors & Objects",
    descFr: "Les couleurs et objets du quotidien",
    descEn: "Everyday colors and objects",
    order: 5,
  },
  verbs: {
    titleFr: "Verbes courants",
    titleEn: "Common Verbs",
    descFr: "Les verbes les plus utilisés en wolof",
    descEn: "The most commonly used Wolof verbs",
    order: 6,
  },
  days: {
    titleFr: "Jours et temps",
    titleEn: "Days & Time",
    descFr: "Les jours de la semaine et les expressions de temps",
    descEn: "Days of the week and time expressions",
    order: 7,
  },
  phrases: {
    titleFr: "Phrases du quotidien",
    titleEn: "Everyday Phrases",
    descFr: "Des phrases utiles pour converser en wolof",
    descEn: "Useful phrases for everyday conversation in Wolof",
    order: 8,
  },
};

type Lang = "fr" | "en";

interface ChallengeOption {
  text: string;
  correct: boolean;
  imageSrc: string | null;
  audioSrc: string | null;
}

interface Challenge {
  type: "SELECT" | "ASSIST";
  question: string;
  order: number;
  options: ChallengeOption[];
}

interface LessonOut {
  title: string;
  order: number;
  challenges: Challenge[];
}

interface UnitOut {
  title: string;
  description: string;
  order: number;
  lessons: LessonOut[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(((i + 1) * 2654435761) % (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(
  pool: VocabItem[],
  exclude: VocabItem,
  count: number,
  field: "wolof" | Lang
): string[] {
  const candidates = pool.filter((v) => v.wolof !== exclude.wolof);
  const shuffled = shuffle(candidates);
  return shuffled.slice(0, count).map((v) => v[field]);
}

function buildChallengesForItem(
  item: VocabItem,
  categoryPool: VocabItem[],
  lang: Lang,
  startOrder: number
): Challenge[] {
  const translation = item[lang];
  const challenges: Challenge[] = [];
  let order = startOrder;

  // SELECT: "How do you say X in Wolof?" -> pick the wolof word
  const distractorsWolof = pickDistractors(categoryPool, item, 2, "wolof");
  challenges.push({
    type: "SELECT",
    question:
      lang === "fr"
        ? `Comment dit-on "${translation}" en wolof ?`
        : `How do you say "${translation}" in Wolof?`,
    order: order++,
    options: shuffle([
      { text: item.wolof, correct: true, imageSrc: null, audioSrc: null },
      ...distractorsWolof.map((t) => ({
        text: t,
        correct: false,
        imageSrc: null,
        audioSrc: null,
      })),
    ]),
  });

  // ASSIST: show the wolof word, pick the correct translation
  const distractorsTrans = pickDistractors(categoryPool, item, 2, lang);
  challenges.push({
    type: "ASSIST",
    question: item.wolof,
    order: order++,
    options: shuffle([
      { text: translation, correct: true, imageSrc: null, audioSrc: null },
      ...distractorsTrans.map((t) => ({
        text: t,
        correct: false,
        imageSrc: null,
        audioSrc: null,
      })),
    ]),
  });

  return challenges;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function buildUnits(lang: Lang): UnitOut[] {
  const categories = Object.keys(CATEGORY_META) as Category[];

  return categories
    .map((category) => {
      const meta = CATEGORY_META[category];
      const items = VOCAB.filter((v) => v.category === category);
      // ~5 items per lesson -> 5-8 challenges per lesson (2 per item, last
      // lesson may have a review lesson mixing everything already covered)
      const lessonGroups = chunk(items, 3);

      const lessons: LessonOut[] = lessonGroups.map((group, idx) => {
        let order = 1;
        const challenges: Challenge[] = [];
        for (const item of group) {
          challenges.push(
            ...buildChallengesForItem(item, items, lang, order)
          );
          order += 2;
        }
        return {
          title:
            lang === "fr"
              ? `${meta.titleFr} ${idx + 1}`
              : `${meta.titleEn} ${idx + 1}`,
          order: idx + 1,
          challenges,
        };
      });

      // Review lesson: one SELECT + one ASSIST per item, capped to keep
      // per-lesson challenge count reasonable (5-8).
      const reviewItems = items.slice(0, 4);
      let reviewOrder = 1;
      const reviewChallenges: Challenge[] = [];
      for (const item of reviewItems) {
        reviewChallenges.push(
          ...buildChallengesForItem(item, items, lang, reviewOrder)
        );
        reviewOrder += 2;
      }
      lessons.push({
        title: lang === "fr" ? `Révision : ${meta.titleFr}` : `Review: ${meta.titleEn}`,
        order: lessons.length + 1,
        challenges: reviewChallenges,
      });

      return {
        title: lang === "fr" ? `Unité ${meta.order} : ${meta.titleFr}` : `Unit ${meta.order}: ${meta.titleEn}`,
        description: lang === "fr" ? meta.descFr : meta.descEn,
        order: meta.order,
        lessons,
      };
    })
    .sort((a, b) => a.order - b.order);
}

function countStats(units: UnitOut[]) {
  let lessons = 0,
    challenges = 0,
    options = 0;
  for (const u of units) {
    lessons += u.lessons.length;
    for (const l of u.lessons) {
      challenges += l.challenges.length;
      for (const c of l.challenges) options += c.options.length;
    }
  }
  return { units: units.length, lessons, challenges, options };
}

const coreCount = VOCAB.filter((v) => v.confidence === "core").length;
const reviewCount = VOCAB.filter((v) => v.confidence === "review").length;

const frUnits = buildUnits("fr");
const enUnits = buildUnits("en");

const output = {
  meta: {
    language: "Wolof",
    note:
      "AI-assembled content using standard, well-attested Wolof vocabulary " +
      "(greetings, numbers, family, food, colors, common verbs, days, everyday " +
      "phrases). Vocabulary is not placeholder/fake, but native-speaker review " +
      "is still recommended before wide launch, especially for the items " +
      "flagged 'review' below (spelling variants, register, and dialectal " +
      "differences are common in Wolof).",
    coreVocabCount: coreCount,
    reviewVocabCount: reviewCount,
    reviewFlaggedWords: VOCAB.filter((v) => v.confidence === "review").map(
      (v) => v.wolof
    ),
    generatedBy: "scripts/generate-wolof-content.ts",
    version: "1.0.0",
  },
  courses: [
    {
      course: { title: "Wolof (depuis le français)", imageSrc: "/sn.svg" },
      units: frUnits,
      stats: countStats(frUnits),
    },
    {
      course: { title: "Wolof (from English)", imageSrc: "/sn.svg" },
      units: enUnits,
      stats: countStats(enUnits),
    },
  ],
};

const outPath = join(process.cwd(), "seeds", "wolof-course.json");
writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log("Wrote", outPath);
console.log("FR course stats:", output.courses[0].stats);
console.log("EN course stats:", output.courses[1].stats);
