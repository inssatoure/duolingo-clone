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
 * Mobile Safari/iOS refuses to play audio served without HTTP Range support:
 * before actually playing, it sends a preflight `Range` request (often just
 * `bytes=0-1`) to check the server supports partial content, and silently
 * aborts playback if it doesn't get a 206 with `Accept-Ranges`/`Content-Range`
 * back. A plain 200-with-full-body response (which works fine in curl, or in
 * desktop Chrome, which is lenient about this) is not enough on iOS. This
 * wraps a full in-memory buffer as either a full 200 or a ranged 206 response
 * depending on the request.
 */
const audioResponse = (buffer: Buffer, mime: string, req: NextRequest): NextResponse => {
  const range = req.headers.get("range");
  const baseHeaders = {
    "Content-Type": mime,
    "Cache-Control": "public, max-age=300",
    "Accept-Ranges": "bytes",
    "X-Debug-Range-Received": range ?? "none",
  };

  if (!range) {
    return new NextResponse(new Uint8Array(buffer), {
      headers: { ...baseHeaders, "Content-Length": String(buffer.length) },
    });
  }

  const match = /bytes=(\d*)-(\d*)/.exec(range);
  const total = buffer.length;
  let start = match?.[1] ? parseInt(match[1], 10) : 0;
  let end = match?.[2] ? parseInt(match[2], 10) : total - 1;
  if (Number.isNaN(start) || start < 0) start = 0;
  if (Number.isNaN(end) || end >= total) end = total - 1;
  if (start > end) start = end;

  return new NextResponse(new Uint8Array(buffer.subarray(start, end + 1)), {
    status: 206,
    headers: {
      ...baseHeaders,
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Content-Length": String(end - start + 1),
    },
  });
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
    return audioResponse(Buffer.from(row.data, "base64"), row.mime, req);
  }

  const canLazyGenerate = (!lang || lang === "wo") && isWolofText(text);
  if (!canLazyGenerate) return new NextResponse("Not recorded.", { status: 404 });

  if (isRateLimited(`tts-gen:${key}`, 2, 10 * 60 * 1000) || isRateLimited("tts-gen:*", 30, 10 * 60 * 1000)) {
    return new NextResponse("Not recorded.", { status: 404 });
  }

  try {
    const audioBase64 = await synthesizeWolofSpeech(text);
    await upsertRecording({ textKey: key, lang: "wo", mime: "audio/wav", data: audioBase64, voice: "Aoede" });
    return audioResponse(Buffer.from(audioBase64, "base64"), "audio/wav", req);
  } catch (error) {
    console.error("recordings/play lazy-generate failed:", error);
    if (error instanceof GeminiTtsError) return new NextResponse("Not recorded.", { status: 404 });
    return new NextResponse("Not recorded.", { status: 404 });
  }
};
