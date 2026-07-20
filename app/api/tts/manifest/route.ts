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

  await ensureRecordingsTable();
  const rows = (await db.execute(
    sql`SELECT text_key, lang FROM recordings WHERE lang IN ('fr', 'en')`
  )) as unknown as { rows?: { text_key: string; lang: string }[] };
  const recorded = new Set(
    (rows.rows ?? (rows as unknown as { text_key: string; lang: string }[])).map(
      (r) => `${r.lang}:${r.text_key}`
    )
  );

  const items = buildTtsManifest().map((item) => ({
    ...item,
    recorded: recorded.has(`${item.lang}:${normalizeKey(item.text)}`),
  }));

  return NextResponse.json({ items });
};
