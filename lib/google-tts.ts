// Server-only: calls the Google Cloud Text-to-Speech REST API.
// Requires GOOGLE_TTS_API_KEY to be set (Vercel project env var) — never
// commit the key itself to the repo.
//
// Wolof is NOT among Google's supported languages (verified against the
// live /v1/voices list: 63 languages, no "wo" prefix, not even under the
// newer Chirp3-HD voices). Only French and English are TTS-able here —
// Wolof audio must come from the Recording Studio (native speaker).

const VOICE_BY_LANG: Record<"fr" | "en", { languageCode: string; name: string }> = {
  fr: { languageCode: "fr-FR", name: "fr-FR-Wavenet-C" },
  en: { languageCode: "en-US", name: "en-US-Wavenet-F" },
};

export class GoogleTtsError extends Error {}

/** Synthesizes `text` and returns the audio as a base64-encoded MP3. */
export const synthesizeSpeech = async (
  text: string,
  lang: "fr" | "en"
): Promise<string> => {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey)
    throw new GoogleTtsError("GOOGLE_TTS_API_KEY is not configured.");

  const voice = VOICE_BY_LANG[lang];
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice,
        audioConfig: { audioEncoding: "MP3", speakingRate: 0.95 },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new GoogleTtsError(`Google TTS ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as { audioContent?: string };
  if (!data.audioContent)
    throw new GoogleTtsError("Google TTS returned no audio content.");
  return data.audioContent;
};
