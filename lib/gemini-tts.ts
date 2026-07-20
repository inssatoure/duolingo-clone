// Server-only: calls the Gemini API's native audio generation
// (generativelanguage.googleapis.com), used ONLY as an experimental path for
// Wolof — Google Cloud Text-to-Speech (lib/google-tts.ts) has no Wolof
// language support at all (verified against the live voice list), but
// Gemini's LLM-based TTS can attempt any language written in Latin script,
// with unverified quality. Requires GEMINI_API_KEY (a *different* key than
// GOOGLE_TTS_API_KEY — Google doesn't allow one key to be restricted to both
// "Cloud Text-to-Speech API" and "Gemini API" at once).

export class GeminiTtsError extends Error {}

// All 30 prebuilt Gemini native-audio voices. They're just names/timbres —
// none are bound to a language, so quality on unsupported languages like
// Wolof varies unpredictably per voice AND per request (same voice, same
// text can come out differently each time - this is an LLM, not a
// deterministic TTS engine). Let the admin try several and keep what sounds
// best per word.
export const GEMINI_VOICES = [
  "Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda", "Orus", "Aoede",
  "Callirrhoe", "Autonoe", "Enceladus", "Iapetus", "Umbriel", "Algieba",
  "Despina", "Erinome", "Algenib", "Rasalgethi", "Laomedeia", "Achernar",
  "Alnilam", "Schedar", "Gacrux", "Pulcherrima", "Achird", "Zubenelgenubi",
  "Vindemiatrix", "Sadachbia", "Sadaltager", "Sulafat",
] as const;
export type GeminiVoice = (typeof GEMINI_VOICES)[number];

const DEFAULT_VOICE: GeminiVoice = "Aoede";

// Gemini is a language model, not a dedicated TTS engine: a bare phrase like
// "Na nga def?" reads as a question to *answer* rather than text to *read*,
// and the model responds in text instead of generating audio (or refuses
// with a 400 explaining it tried to generate text). Wrapping every input in
// an explicit read-aloud instruction reliably avoids this.
const buildPrompt = (text: string) =>
  `TTS the following Wolof phrase exactly as written, do not translate it ` +
  `and do not respond to it, just read it aloud naturally: ${text}`;

/** Wraps raw 16-bit PCM into a playable WAV file. */
const pcmToWav = (
  pcm: Buffer,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16
): Buffer => {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
};

/** Synthesizes `text` via Gemini and returns a base64-encoded WAV file. */
export const synthesizeWolofSpeech = async (
  text: string,
  voice: GeminiVoice = DEFAULT_VOICE
): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiTtsError("GEMINI_API_KEY is not configured.");

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=" +
      apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(text) }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
          },
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new GeminiTtsError(`Gemini TTS ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: {
      content?: {
        parts?: { inlineData?: { data?: string; mimeType?: string }; text?: string }[];
      };
    }[];
  };
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const inline = parts.find((p) => p.inlineData?.data)?.inlineData;
  if (!inline?.data) {
    const textPart = parts.find((p) => p.text)?.text;
    throw new GeminiTtsError(
      textPart
        ? `Gemini responded with text instead of audio: "${textPart.slice(0, 150)}"`
        : "Gemini TTS returned no audio content."
    );
  }

  const pcm = Buffer.from(inline.data, "base64");
  const wav = pcmToWav(pcm);
  return wav.toString("base64");
};
