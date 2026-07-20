"use client";

import dictionaryData from "@/seeds/dictionary.json";

/**
 * Plays the best available audio for a text:
 * 1. A native-speaker recording from /api/recordings/play (any language match).
 * 2. Browser speech synthesis fallback for French/English text (no Wolof
 *    voice exists in browsers, so unrecorded Wolof stays silent rather than
 *    being mispronounced).
 */

// Extract the quoted word from generated questions like:
//   Comment dit-on "Eau" en wolof ? / How do you say "Water" in Wolof? /
//   Naka lañuy wax «Ndox» ci farañse ?
export const extractQuoted = (text: string): string | null => {
  const match = /«([^»]+)»|"([^"]+)"/.exec(text);
  return match ? (match[1] ?? match[2]).trim() : null;
};

const synthLangCode = (lang: "fr" | "en") => (lang === "fr" ? "fr-FR" : "en-US");

// Names of higher-quality "neural"/cloud voices some browsers expose locally
// (Chrome ships Google's online voices, Edge ships Microsoft's Natural
// voices). We prefer these over the default robotic system voice when present.
const PREFERRED_VOICE_HINTS = [
  "google",
  "natural",
  "neural",
  "online",
  "denise",
  "julie",
  "hortense",
  "aria",
  "jenny",
  "guy",
];

let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== "undefined" && window.speechSynthesis) {
  const loadVoices = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

const pickVoice = (lang: "fr" | "en") => {
  const langCode = synthLangCode(lang);
  const candidates = cachedVoices.filter((v) => v.lang.startsWith(langCode.slice(0, 2)));
  const preferred = candidates.find((v) =>
    PREFERRED_VOICE_HINTS.some((hint) => v.name.toLowerCase().includes(hint))
  );
  return preferred ?? candidates[0];
};

const speak = (text: string, lang: "fr" | "en") => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = synthLangCode(lang);
  utterance.rate = 0.92;
  const voice = pickVoice(lang);
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
};

const WOLOF_WORDS = new Set(
  (dictionaryData as { wolof: string }[]).map((d) => d.wolof.trim().toLowerCase())
);

/** True when the text is a known Wolof vocabulary item (no synth fallback). */
export const isWolofText = (text: string) =>
  WOLOF_WORDS.has(text.trim().toLowerCase());

/**
 * @param text        what to pronounce
 * @param synthLang   language for the speech-synthesis fallback; null disables
 *                    the fallback (e.g. Wolof text with no recording yet)
 */
export const playText = (text: string, synthLang: "fr" | "en" | null = null) => {
  if (typeof window === "undefined") return;
  const url = `/api/recordings/play?text=${encodeURIComponent(text)}`;
  const audio = new Audio(url);
  audio.onerror = () => {
    if (synthLang) speak(text, synthLang);
  };
  audio.play().catch(() => {
    if (synthLang) speak(text, synthLang);
  });
};

/** Resolves which language to use for the speech-synthesis fallback, based on
 * the learner's interface locale (and, for Wolof speakers, their chosen
 * target language). */
export const resolveSynthLang = (
  locale: "fr" | "en" | "wo",
  target: "fr" | "en" | null
): "fr" | "en" => (locale === "wo" ? (target ?? "fr") : locale === "en" ? "en" : "fr");

/** Speaks `text` using a native recording if available, else TTS — unless the
 * text is a Wolof vocabulary word, in which case TTS is never used. */
export const speakSmart = (
  text: string,
  locale: "fr" | "en" | "wo",
  target: "fr" | "en" | null
) => {
  const synthLang = isWolofText(text) ? null : resolveSynthLang(locale, target);
  playText(text, synthLang);
};
