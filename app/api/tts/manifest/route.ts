import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db/drizzle";
import { getIsAdmin } from "@/lib/admin";
import { ensureRecordingsTable, normalizeKey } from "@/lib/recordings";
import { buildTtsManifest } from "@/lib/tts-manifest";

/** Admin: full list of FR/EN texts worth having natural TTS audio for,
 * each flagged with whether it's already recorded. */
export const GET = async () => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  try {
    await ensureRecordingsTable();
    const rows = (await db.execute(
      sql`SELECT text_key, lang, voice FROM recordings WHERE lang IN ('fr', 'en', 'wo')`
    )) as unknown as { rows?: { text_key: string; lang: string; voice: string | null }[] };
    const rowList = rows.rows ?? (rows as unknown as { text_key: string; lang: string; voice: string | null }[]);
    const voiceByKey = new Map(
      rowList.map((r) => [`${r.lang}:${r.text_key}`, r.voice])
    );

    const items = buildTtsManifest().map((item) => {
      const key = `${item.lang}:${normalizeKey(item.text)}`;
      return {
        ...item,
        recorded: voiceByKey.has(key),
        voice: voiceByKey.get(key) ?? null,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("TTS manifest failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
};
