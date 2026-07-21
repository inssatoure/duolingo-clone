"use client";

import { normalizeKey } from "@/lib/recordings-key";
import { isWolofText } from "@/lib/wolof-words";

export { isWolofText };

/**
 * Plays the best available audio for a text:
 * 1. A native-speaker/TTS recording from /api/recordings/play, if one exists.
 * 2. Browser speech synthesis fallback for French/English text (no Wolof
 *    voice exists in browsers, so unrecorded Wolof stays silent rather than
 *    being mispronounced).
 *
 * IMPORTANT (mobile): the choice between (1) and (2) must be made
 * SYNCHRONOUSLY, inside the click handler's call stack. Mobile Safari/WebKit
 * only allows `speechSynthesis.speak()` when it's a direct, synchronous
 * result of a user gesture; calling it later from an <audio> element's async
 * onerror/network-failure callback is silently ignored on iOS (desktop
 * browsers are far more lenient about this, which is why a "play on error"
 * fallback pattern used to work in testing but was silent on phones). To
 * make the decision synchronously we pre-fetch, once, the set of texts that
 * actually have a recording.
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

/** Must be called synchronously within the user gesture (see file header). */
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

// --- Recorded-keys cache -----------------------------------------------
// Populated once per page load; empty (not yet loaded) means we optimistically
// try native audio first for the very first click or two, same as before.
let recordedKeys: Set<string> | null = null;
let recordedKeysPromise: Promise<Set<string>> | null = null;

const loadRecordedKeys = (): Promise<Set<string>> => {
  if (recordedKeysPromise) return recordedKeysPromise;
  recordedKeysPromise = fetch("/api/recordings/keys")
    .then((r) => r.json() as Promise<{ keys: string[] }>)
    .then((d) => {
      recordedKeys = new Set(d.keys);
      return recordedKeys;
    })
    .catch(() => new Set<string>());
  return recordedKeysPromise;
};

if (typeof window !== "undefined") void loadRecordedKeys();

/** True once we've confirmed a recording exists for this exact text (any
 * language, matching /api/recordings/play's own lookup order). */
const hasKnownRecording = (text: string): boolean => {
  if (!recordedKeys) return false; // not loaded yet - caller decides fallback
  const key = normalizeKey(text);
  return (
    recordedKeys.has(`wo:${key}`) ||
    recordedKeys.has(`fr:${key}`) ||
    recordedKeys.has(`en:${key}`)
  );
};

const playAudioElement = (text: string) => {
  const url = `/api/recordings/play?text=${encodeURIComponent(text)}`;
  const audio = new Audio(url);
  audio.play().catch(() => {
    /* best-effort; if this was actually unrecorded despite our cache, the
     * learner just hears nothing for this one tap rather than a delayed
     * async TTS call that mobile browsers would silently drop anyway. */
  });
};

/**
 * @param text        what to pronounce
 * @param synthLang   language for the speech-synthesis fallback; null disables
 *                    the fallback (e.g. Wolof text with no recording yet)
 */
export const playText = (text: string, synthLang: "fr" | "en" | null = null) => {
  if (typeof window === "undefined") return;

  if (recordedKeys === null) {
    // Cache not loaded yet (first tap or two on a fresh page): keep the old
    // best-effort behavior so early clicks still make *some* sound on
    // desktop, and kick the load off again in case it hasn't started.
    void loadRecordedKeys();
    const url = `/api/recordings/play?text=${encodeURIComponent(text)}`;
    const audio = new Audio(url);
    audio.onerror = () => {
      if (synthLang) speak(text, synthLang);
    };
    audio.play().catch(() => {
      if (synthLang) speak(text, synthLang);
    });
    return;
  }

  if (hasKnownRecording(text)) {
    playAudioElement(text);
  } else if (synthLang) {
    // Called synchronously in the same tick as the click - required on iOS.
    speak(text, synthLang);
  }
};

/** Resolves which language to use for the speech-synthesis fallback, based on
 * the learner's interface locale (and, for Wolof speakers, their chosen
 * target language). */
export const resolveSynthLang = (
  locale: "fr" | "en" | "wo",
  target: "fr" | "en" | null
): "fr" | "en" => (locale === "wo" ? (target ?? "fr") : locale === "en" ? "en" : "fr");

/** Speaks `text` using a native recording if available, else TTS — unless the
 * text is a Wolof vocabulary word, in which case TTS is never used and we
 * always attempt to play a recording instead: the server auto-generates one
 * on first request for any known Wolof word (see /api/recordings/play), so
 * there's no synchronous-fallback tradeoff to make here like there is for
 * fr/en (a Wolof word may take a few seconds to play the very first time
 * anyone in the app requests it, then it's cached forever). */
export const speakSmart = (
  text: string,
  locale: "fr" | "en" | "wo",
  target: "fr" | "en" | null
) => {
  if (isWolofText(text)) {
    playAudioElement(text);
    return;
  }
  playText(text, resolveSynthLang(locale, target));
};
