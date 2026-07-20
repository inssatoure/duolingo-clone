import { type NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { getIsAdmin } from "@/lib/admin";
import { GeminiTtsError, synthesizeWolofSpeech } from "@/lib/gemini-tts";
import { GoogleTtsError, synthesizeSpeech } from "@/lib/google-tts";
import { ensureRecordingsTable, normalizeKey } from "@/lib/recordings";
import { sql } from "drizzle-orm";

export const maxDuration = 60;

type Item = { text: string; lang: "fr" | "en" | "wo" };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRateLimited = (error: unknown) =>
  (error instanceof GoogleTtsError || error instanceof GeminiTtsError) &&
  error.message.includes("429");

/** Synthesizes one item, retrying with backoff on 429 (rate limit).
 * Returns [audioBase64, mime]. */
const synthesizeWithRetry = async (
  item: Item,
  attempt = 1
): Promise<[string, string]> => {
  try {
    if (item.lang === "wo")
      return [await synthesizeWolofSpeech(item.text), "audio/wav"];
    return [await synthesizeSpeech(item.text, item.lang), "audio/mpeg"];
  } catch (error) {
    if (isRateLimited(error) && attempt < 4) {
      await sleep(attempt * 3000);
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

  const body = (await req.json()) as { items?: Item[] };
  const items = body.items ?? [];
  if (items.length === 0 || items.length > 20)
    return new NextResponse("Provide 1-20 items.", { status: 400 });

  await ensureRecordingsTable();

  const results: { text: string; lang: Item["lang"]; ok: boolean; error?: string }[] = [];

  for (const item of items) {
    try {
      const [audioBase64, mime] = await synthesizeWithRetry(item);
      const key = normalizeKey(item.text);
      await db.execute(sql`
        INSERT INTO recordings (text_key, lang, mime, data, updated_at)
        VALUES (${key}, ${item.lang}, ${mime}, ${audioBase64}, now())
        ON CONFLICT (text_key, lang)
        DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data, updated_at = now()
      `);
      results.push({ text: item.text, lang: item.lang, ok: true });
    } catch (error) {
      results.push({
        text: item.text,
        lang: item.lang,
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
    // Small pacing gap between calls, independent of retries, to stay under
    // typical free-tier per-minute quotas. Gemini is heavier, pace slower.
    await sleep(item.lang === "wo" ? 800 : 350);
  }

  return NextResponse.json({ results });
};
