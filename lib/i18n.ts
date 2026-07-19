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
    // Lesson flow
    selectMeaning: "Choisis la bonne traduction",
    nicelyDone: "Bien joué !",
    tryAgain: "Essaie encore.",
    practiceAgain: "Refaire la leçon",
    lessonComplete: "Bravo ! Tu as terminé la leçon.",
    somethingWrong: "Une erreur est survenue. Réessaie.",
    heartsLeft: "Cœurs restants",
    totalXp: "XP gagnés",
    // Modals
    exitTitle: "Attends, ne pars pas !",
    exitDescription: "Tu es sur le point de quitter la leçon. Tu es sûr(e) ?",
    keepLearning: "Continuer la leçon",
    endSession: "Quitter",
    noHeartsTitle: "Tu n'as plus de cœurs !",
    noHeartsDescription:
      "Passe en Pro pour des cœurs illimités, ou achètes-en dans la boutique.",
    unlimitedHearts: "Cœurs illimités",
    noThanks: "Non merci",
    practiceTitle: "Leçon d'entraînement",
    practiceDescription:
      "Refais des leçons pour regagner des cœurs et des points. Tu ne peux pas en perdre ici.",
    understood: "J'ai compris",
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
    selectMeaning: "Select the correct meaning",
    nicelyDone: "Nicely done!",
    tryAgain: "Try again.",
    practiceAgain: "Practice again",
    lessonComplete: "Great job! You've completed the lesson.",
    somethingWrong: "Something went wrong. Please try again.",
    heartsLeft: "Hearts left",
    totalXp: "Total XP",
    exitTitle: "Wait, don't go!",
    exitDescription: "You're about to leave the lesson. Are you sure?",
    keepLearning: "Keep learning",
    endSession: "End session",
    noHeartsTitle: "You ran out of hearts!",
    noHeartsDescription:
      "Get Pro for unlimited hearts, or purchase them in the store.",
    unlimitedHearts: "Get unlimited hearts",
    noThanks: "No thanks",
    practiceTitle: "Practice lesson",
    practiceDescription:
      "Use practice lessons to regain hearts and points. You cannot lose hearts here.",
    understood: "I understand",
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
    selectMeaning: "Tannal tekki bi baax",
    nicelyDone: "Baax na lool !",
    tryAgain: "Jéemaatal.",
    practiceAgain: "Defaat leson bi",
    lessonComplete: "Jërëjëf ! Pare nga leson bi.",
    somethingWrong: "Am na njumte. Jéemaatal.",
    heartsLeft: "Xol yi des",
    totalXp: "XP yi nga am",
    exitTitle: "Xaaral, bul dem !",
    exitDescription: "Dangay génn leson bi. Ndax wóor nga ?",
    keepLearning: "Wéyal jàng bi",
    endSession: "Génn",
    noHeartsTitle: "Amatoo xol !",
    noHeartsDescription:
      "Jëlal Pro ngir xol yu amul àpp, walla jënd ci bitik bi.",
    unlimitedHearts: "Xol yu amul àpp",
    noThanks: "Déedéet, jërëjëf",
    practiceTitle: "Leson tàggat",
    practiceDescription:
      "Defaat leson yi ngir amaat xol ak poñ. Fii mënuloo ñàkk xol.",
    understood: "Dégg naa",
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
