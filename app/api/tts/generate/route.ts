import { type NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { getIsAdmin } from "@/lib/admin";
import { synthesizeSpeech } from "@/lib/google-tts";
import { ensureRecordingsTable, normalizeKey } from "@/lib/recordings";
import { sql } from "drizzle-orm";

export const maxDuration = 60;

type Item = { text: string; lang: "fr" | "en" | "wo" };

/** Admin: batch-generate Google TTS audio and store it as recordings.
 * Body: { items: [{ text, lang }] } — keep batches small (~15-20) to stay
 * within the serverless time budget. */
export const POST = async (req: NextRequest) => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  const body = (await req.json()) as { items?: Item[] };
  const items = body.items ?? [];
  if (items.length === 0 || items.length > 30)
    return new NextResponse("Provide 1-30 items.", { status: 400 });

  await ensureRecordingsTable();

  const results = await Promise.all(
    items.map(async (item) => {
      try {
        const audioBase64 = await synthesizeSpeech(item.text, item.lang);
        const key = normalizeKey(item.text);
        await db.execute(sql`
          INSERT INTO recordings (text_key, lang, mime, data, updated_at)
          VALUES (${key}, ${item.lang}, ${"audio/mpeg"}, ${audioBase64}, now())
          ON CONFLICT (text_key, lang)
          DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data, updated_at = now()
        `);
        return { text: item.text, lang: item.lang, ok: true };
      } catch (error) {
        return {
          text: item.text,
          lang: item.lang,
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    })
  );

  return NextResponse.json({ results });
};
