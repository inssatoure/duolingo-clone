export type Locale = "fr" | "en";

export const LOCALE_COOKIE = "wolingo-locale";

const fr = {
    // Marketing
    heroTitle: "Apprends, pratique et maîtrise le wolof avec WolofLingo.",
    heroSubtitle: "La langue du Sénégal, à ton rythme. Gratuit et fun !",
    getStarted: "Commencer",
    haveAccount: "J'ai déjà un compte",
    continueLearning: "Continuer l'apprentissage",
    login: "Connexion",
    // Onboarding
    obQuestion: "Quelle est ta langue ?",
    obSubtitle: "Ton interface et tes leçons seront dans cette langue.",
    obFrench: "Français",
    obEnglish: "English",
    obLearnHint: "J'apprends le wolof depuis le français",
    obReady: "Jërëjëf ! C'est parti 🎉",
    obReadySub: "Le wolof t'attend… Ndank-ndank !",
    // Sidebar / nav
    navLearn: "Apprendre",
    navLeaderboard: "Classement",
    navQuests: "Quêtes",
    navShop: "Boutique",
    // Courses
    coursesTitle: "Cours de langues",
    // Lesson footer
    check: "Vérifier",
    next: "Suivant",
    retry: "Réessayer",
    continue: "Continuer",
};

export type Dict = { [K in keyof typeof fr]: string };

export const DICT: Record<Locale, Dict> = {
  fr,
  en: {
    heroTitle: "Learn, practice and master Wolof with WolofLingo.",
    heroSubtitle: "The language of Senegal, at your own pace. Free and fun!",
    getStarted: "Get started",
    haveAccount: "I already have an account",
    continueLearning: "Continue learning",
    login: "Log in",
    obQuestion: "What's your language?",
    obSubtitle: "Your interface and lessons will use this language.",
    obFrench: "Français",
    obEnglish: "English",
    obLearnHint: "I'm learning Wolof from English",
    obReady: "Jërëjëf! Let's go 🎉",
    obReadySub: "Wolof awaits you… Ndank-ndank!",
    navLearn: "Learn",
    navLeaderboard: "Leaderboard",
    navQuests: "Quests",
    navShop: "Shop",
    coursesTitle: "Language courses",
    check: "Check",
    next: "Next",
    retry: "Retry",
    continue: "Continue",
  },
};

export const isLocale = (v: unknown): v is Locale => v === "fr" || v === "en";

/** Which seeded course matches a UI locale (matched against course titles). */
export const courseMatchesLocale = (courseTitle: string, locale: Locale) =>
  locale === "fr"
    ? courseTitle.toLowerCase().includes("français")
    : courseTitle.toLowerCase().includes("english");
