import jolaDictionaryData from "@/seeds/jola-dictionary.json";
import wolofDictionaryData from "@/seeds/dictionary.json";

// Server- and client-safe (no "use client" directive). Used to gate which
// texts are allowed to trigger an on-demand Gemini TTS generation
// server-side (never generate audio for arbitrary attacker-supplied text -
// only for known course vocabulary), and client-side to decide when to
// always attempt a recording instead of falling back to browser speech
// synthesis (no browser ships a Wolof or Jola voice).
//
// To add a new "no browser TTS" language: add its dictionary import above,
// register it below with its `recordings.lang` code, and add the language's
// human name to LANGUAGE_NAMES in lib/gemini-tts.ts.
export const NO_TTS_LANGUAGES: { code: string; words: Set<string> }[] = [
  {
    code: "wo",
    words: new Set(
      (wolofDictionaryData as { wolof: string }[]).map((d) => d.wolof.trim().toLowerCase())
    ),
  },
  {
    code: "jo",
    words: new Set(
      (jolaDictionaryData as { jola: string }[]).map((d) => d.jola.trim().toLowerCase())
    ),
  },
];

/** True when the text is a known vocabulary item in any no-browser-TTS
 * language (Wolof, Jola, ...). Kept for existing call sites. */
export const isWolofText = (text: string) => matchNoTtsLanguage(text) !== null;

/** Returns the `recordings.lang` code ("wo", "jo", ...) if `text` is a known
 * vocabulary item in a no-browser-TTS language, else null. */
export const matchNoTtsLanguage = (text: string): string | null => {
  const normalized = text.trim().toLowerCase();
  const hit = NO_TTS_LANGUAGES.find((l) => l.words.has(normalized));
  return hit?.code ?? null;
};
