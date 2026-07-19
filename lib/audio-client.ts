"use client";

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

const speak = (text: string, lang: "fr" | "en") => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = synthLangCode(lang);
  utterance.rate = 0.92;
  window.speechSynthesis.speak(utterance);
};

/**
 * @param text        what to pronounce
 * @param synthLang   language for the speech-synthesis fallback; null disables
 *                    the fallback (e.g. Wolof text with no recording yet)
 */
import dictionaryData from "@/seeds/dictionary.json";

const WOLOF_WORDS = new Set(
  (dictionaryData as { wolof: string }[]).map((d) => d.wolof.trim().toLowerCase())
);

/** True when the text is a known Wolof vocabulary item (no synth fallback). */
export const isWolofText = (text: string) =>
  WOLOF_WORDS.has(text.trim().toLowerCase());

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
