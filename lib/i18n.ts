export type Locale = "fr" | "en" | "wo";

export const LOCALE_COOKIE = "wolingo-locale";
/** For Wolof speakers: which language they chose to learn ("fr" | "en"). */
export const TARGET_COOKIE = "wolingo-target";

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
    navDictionary: "Dictionnaire",
    navLeaderboard: "Classement",
    navLeagues: "Ligues",
    navQuests: "Quêtes",
    navShop: "Boutique",
    navCourses: "Cours",
    navAdmin: "Admin",
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
    navDictionary: "Dictionary",
    navLeaderboard: "Leaderboard",
    navLeagues: "Leagues",
    navQuests: "Quests",
    navShop: "Shop",
    navCourses: "Courses",
    navAdmin: "Admin",
    coursesTitle: "Language courses",
    check: "Check",
    next: "Next",
    retry: "Retry",
    continue: "Continue",
  },
  // Wolof interface strings (standard everyday Wolof; native review welcome).
  wo: {
    heroTitle: "Jàngal farañse ak angale ci wolof, ak WolofLingo.",
    heroSubtitle: "Ci sa lakk, ci sa waxtu. Amul fey, am na bànneex !",
    getStarted: "Tàmbali",
    haveAccount: "Am naa kont ba noppi",
    continueLearning: "Wéyal jàng bi",
    login: "Dugg",
    obQuestion: "Ban làkk nga dégg ?",
    obSubtitle: "Sa interface ak say leson dinañu nekk ci làkk boobu.",
    obFrench: "Français",
    obEnglish: "English",
    obLearnHint: "Dégg naa wolof, bëgg naa jàng",
    obReady: "Jërëjëf ! Ñu dem 🎉",
    obReadySub: "Ndank-ndank mooy japp golo ci ñaay !",
    navLearn: "Jàng",
    navDictionary: "Baatukaay",
    navLeaderboard: "Klasman",
    navLeagues: "Lig yi",
    navQuests: "Yëngu yi",
    navShop: "Bitik",
    navCourses: "Cours yi",
    navAdmin: "Admin",
    coursesTitle: "Cours yi",
    check: "Seet",
    next: "Ci kanam",
    retry: "Jéemaat",
    continue: "Wéyal",
  },
};

export const isLocale = (v: unknown): v is Locale =>
  v === "fr" || v === "en" || v === "wo";

/**
 * Which seeded course matches a UI locale (matched against course titles).
 * Wolof speakers also pick a target language (fr/en) during onboarding.
 */
export const courseMatchesLocale = (
  courseTitle: string,
  locale: Locale,
  target?: "fr" | "en" | null
) => {
  const title = courseTitle.toLowerCase();
  if (locale === "wo")
    return target === "en"
      ? title.startsWith("english (ci wolof")
      : title.startsWith("français (ci wolof");
  if (locale === "fr") return title.includes("depuis le français");
  return title.includes("from english");
};
