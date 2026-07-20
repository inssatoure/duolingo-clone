// Server-only: calls the Google Cloud Text-to-Speech REST API.
// Requires GOOGLE_TTS_API_KEY to be set (Vercel project env var) — never
// commit the key itself to the repo.

const VOICE_BY_LANG: Record<
  "fr" | "en" | "wo",
  { languageCode: string; name: string }
> = {
  fr: { languageCode: "fr-FR", name: "fr-FR-Wavenet-C" },
  en: { languageCode: "en-US", name: "en-US-Wavenet-F" },
  // Chirp3-HD "Autonoe" — Google's newest voice family, with usable Wolof
  // coverage unlike the older Standard/WaveNet voices. Still experimental:
  // always let a native recording (Studio) override this if quality isn't
  // good enough for a given word (same recordings table, same key -> the
  // native recording simply replaces the TTS one).
  wo: { languageCode: "wo-SN", name: "wo-SN-Chirp3-HD-Autonoe" },
};

export class GoogleTtsError extends Error {}

/** Synthesizes `text` and returns the audio as a base64-encoded MP3. */
export const synthesizeSpeech = async (
  text: string,
  lang: "fr" | "en" | "wo"
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
