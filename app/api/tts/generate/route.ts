import { type NextRequest, NextResponse } from "next/server";

import { getIsAdmin } from "@/lib/admin";
import { GEMINI_VOICES, GeminiTtsError, synthesizeWolofSpeech, type GeminiVoice } from "@/lib/gemini-tts";
import { GoogleTtsError, synthesizeSpeech } from "@/lib/google-tts";
import { ensureRecordingsTable, normalizeKey, upsertRecording } from "@/lib/recordings";

export const maxDuration = 60;

type Item = { text: string; lang: "fr" | "en" | "wo"; voice?: string };

const isGeminiVoice = (v: unknown): v is GeminiVoice =>
  typeof v === "string" && (GEMINI_VOICES as readonly string[]).includes(v);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// A hard daily/monthly quota exhaustion ("check your plan and billing
// details") - retrying does NOT help, every subsequent call will fail the
// same way until the quota resets or billing is enabled. Must be checked
// before the generic 429 pacing retry, and must abort the whole batch, not
// just this item, to stop burning further calls for nothing.
const isQuotaExhausted = (error: unknown) =>
  error instanceof GeminiTtsError && error.message.includes("plan and billing");

const isRateLimited = (error: unknown) =>
  (error instanceof GoogleTtsError || error instanceof GeminiTtsError) &&
  error.message.includes("429") &&
  !isQuotaExhausted(error);

// Gemini is a language model, not a deterministic TTS engine: the exact same
// request occasionally comes back with no audio (it silently replies in
// text, or the model just doesn't emit an audio part). This is transient and
// usually succeeds on a plain retry, unlike a real error - so retry it too,
// not just rate limits.
const isTransientGeminiFailure = (error: unknown) =>
  error instanceof GeminiTtsError &&
  !error.message.includes("429") &&
  !isQuotaExhausted(error);

/** Synthesizes one item, retrying with backoff on 429 (rate limit) or on a
 * transient Gemini failure (no audio content). Returns [audioBase64, mime]. */
const synthesizeWithRetry = async (
  item: Item,
  attempt = 1
): Promise<[string, string]> => {
  try {
    if (item.lang === "wo")
      return [
        await synthesizeWolofSpeech(
          item.text,
          isGeminiVoice(item.voice) ? item.voice : undefined
        ),
        "audio/wav",
      ];
    return [await synthesizeSpeech(item.text, item.lang), "audio/mpeg"];
  } catch (error) {
    if (isRateLimited(error) && attempt < 4) {
      await sleep(attempt * 3000);
      return synthesizeWithRetry(item, attempt + 1);
    }
    if (isTransientGeminiFailure(error) && attempt < 3) {
      await sleep(500);
      return synthesizeWithRetry(item, attempt + 1);
    }
    throw error;
  }
};

/** Admin: batch-generate TTS audio and store it as recordings.
 * Body: { items: [{ text, lang }] } — fr/en go through Google Cloud TTS
 * (natural WaveNet voices); wo goes through Gemini's native audio generation
 * as an EXPERIMENTAL fallback since Cloud TTS has no Wolof voice at all.
 * Items are processed one at a time with a pacing gap and automatic retry on
 * 429, to stay under free-tier per-minute quotas. */
export const POST = async (req: NextRequest) => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  try {
    const body = (await req.json()) as { items?: Item[] };
    const items = body.items ?? [];
    if (items.length === 0 || items.length > 20)
      return NextResponse.json({ error: "Provide 1-20 items." }, { status: 400 });

    await ensureRecordingsTable();

    const results: { text: string; lang: Item["lang"]; ok: boolean; error?: string }[] = [];
    let quotaExhausted = false;

    for (const item of items) {
      try {
        const [audioBase64, mime] = await synthesizeWithRetry(item);
        const key = normalizeKey(item.text);
        const voiceUsed =
          item.lang === "wo" ? (isGeminiVoice(item.voice) ? item.voice : "Aoede") : null;
        await upsertRecording({
          textKey: key,
          lang: item.lang,
          mime,
          data: audioBase64,
          voice: voiceUsed,
        });
        results.push({ text: item.text, lang: item.lang, ok: true });
      } catch (error) {
        results.push({
          text: item.text,
          lang: item.lang,
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        // Stop burning the rest of the batch against an exhausted quota -
        // every remaining Gemini call would fail identically until it resets.
        if (isQuotaExhausted(error)) {
          quotaExhausted = true;
          break;
        }
      }
      // Small pacing gap between calls, independent of retries, to stay under
      // typical free-tier per-minute quotas. Gemini is heavier, pace slower.
      await sleep(item.lang === "wo" ? 800 : 350);
    }

    return NextResponse.json({
      results,
      ...(quotaExhausted && {
        quotaExhausted: true,
        error:
          "Quota Gemini quotidien épuisé. Réessaie plus tard (le quota gratuit se réinitialise après un délai) ou active la facturation sur ton projet Google Cloud pour un quota bien plus élevé.",
      }),
    });
  } catch (error) {
    console.error("TTS generate failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
};
