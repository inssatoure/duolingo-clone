import { sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { ensureRecordingsTable, normalizeKey } from "@/lib/recordings";

/**
 * Public playback endpoint: /api/recordings/play?text=...&lang=wo
 * Without `lang`, searches wo -> fr -> en and returns the first match.
 * Returns the audio bytes, or 404 when nothing is recorded yet.
 */
export const GET = async (req: NextRequest) => {
  const text = req.nextUrl.searchParams.get("text");
  const lang = req.nextUrl.searchParams.get("lang");
  if (!text) return new NextResponse("Missing text.", { status: 400 });

  await ensureRecordingsTable();
  const key = normalizeKey(text);

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
  const row = Array.isArray(rows) ? rows[0] : undefined;
  if (!row) return new NextResponse("Not recorded.", { status: 404 });

  return new NextResponse(Buffer.from(row.data, "base64"), {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "public, max-age=300",
    },
  });
};
