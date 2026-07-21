import dictionaryData from "@/seeds/dictionary.json";

// Server- and client-safe (no "use client" directive), unlike audio-client.ts.
// Used to gate which texts are allowed to trigger an on-demand Gemini TTS
// generation server-side (never generate audio for arbitrary attacker-supplied
// text - only for known course vocabulary).
export const WOLOF_WORDS = new Set(
  (dictionaryData as { wolof: string }[]).map((d) => d.wolof.trim().toLowerCase())
);

export const isWolofText = (text: string) => WOLOF_WORDS.has(text.trim().toLowerCase());
