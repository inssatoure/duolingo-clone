import { sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { GeminiTtsError, synthesizeWolofSpeech } from "@/lib/gemini-tts";
import { isRateLimited } from "@/lib/otp-rate-limit";
import { ensureRecordingsTable, normalizeKey, upsertRecording } from "@/lib/recordings";
import { isWolofText } from "@/lib/wolof-words";

export const maxDuration = 30;

const fetchRecording = async (key: string, lang: string | null) => {
  const result = (await (lang
    ? db.execute(
        sql`SELECT mime, data FROM recordings WHERE text_key = ${key} AND lang = ${lang} LIMIT 1`
      )
    : db.execute(sql`
        SELECT mime, data FROM recordings WHERE text_key = ${key}
        ORDER BY CASE lang WHEN 'wo' THEN 0 WHEN 'fr' THEN 1 ELSE 2 END
        LIMIT 1
      `))) as unknown as { rows?: { mime: string; data: string }[] };
  const rows = result.rows ?? (result as unknown as { mime: string; data: string }[]);
  return Array.isArray(rows) ? rows[0] : undefined;
};

/**
 * Public playback endpoint: /api/recordings/play?text=...&lang=wo
 * Without `lang`, searches wo -> fr -> en and returns the first match.
 *
 * Wolof audio is generated on-demand on first request rather than requiring
 * an admin to have pre-run the batch TTS tool for every word: on a cache
 * miss for a KNOWN Wolof vocabulary word (never for arbitrary text - that
 * would let anyone burn Gemini quota on garbage input), we synthesize it via
 * Gemini, cache it in `recordings`, and serve it immediately. Every word is
 * generated at most once ever after that.
 */
export const GET = async (req: NextRequest) => {
  const text = req.nextUrl.searchParams.get("text");
  const lang = req.nextUrl.searchParams.get("lang");
  if (!text) return new NextResponse("Missing text.", { status: 400 });

  await ensureRecordingsTable();
  const key = normalizeKey(text);

  const row = await fetchRecording(key, lang);
  if (row) {
    return new NextResponse(Buffer.from(row.data, "base64"), {
      headers: { "Content-Type": row.mime, "Cache-Control": "public, max-age=300" },
    });
  }

  const canLazyGenerate = (!lang || lang === "wo") && isWolofText(text);
  if (!canLazyGenerate) return new NextResponse("Not recorded.", { status: 404 });

  if (isRateLimited(`tts-gen:${key}`, 2, 10 * 60 * 1000) || isRateLimited("tts-gen:*", 30, 10 * 60 * 1000)) {
    return new NextResponse("Not recorded.", { status: 404 });
  }

  try {
    const audioBase64 = await synthesizeWolofSpeech(text);
    await upsertRecording({ textKey: key, lang: "wo", mime: "audio/wav", data: audioBase64, voice: "Aoede" });
    return new NextResponse(Buffer.from(audioBase64, "base64"), {
      headers: { "Content-Type": "audio/wav", "Cache-Control": "public, max-age=300" },
    });
  } catch (error) {
    console.error("recordings/play lazy-generate failed:", error);
    if (error instanceof GeminiTtsError) return new NextResponse("Not recorded.", { status: 404 });
    return new NextResponse("Not recorded.", { status: 404 });
  }
};
