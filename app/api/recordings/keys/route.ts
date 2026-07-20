import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db/drizzle";
import { ensureRecordingsTable } from "@/lib/recordings";

/**
 * Public, lightweight: which (lang, text) pairs have a real recording, so
 * the client can decide SYNCHRONOUSLY (inside the click handler) whether to
 * play native audio or call speechSynthesis. This matters specifically for
 * mobile Safari/WebKit, which only allows `speechSynthesis.speak()` when
 * called synchronously within a user gesture - calling it later, from an
 * `<audio>` element's async onerror/network-failure callback, is silently
 * ignored on iOS (desktop browsers are far more lenient, which is why this
 * bug only shows up on phones). Returns text keys only, never audio bytes.
 */
export const GET = async () => {
  try {
    await ensureRecordingsTable();
    const rows = (await db.execute(
      sql`SELECT text_key, lang FROM recordings`
    )) as unknown as { rows?: { text_key: string; lang: string }[] };
    const rowList = rows.rows ?? (rows as unknown as { text_key: string; lang: string }[]);

    return NextResponse.json(
      { keys: rowList.map((r) => `${r.lang}:${r.text_key}`) },
      { headers: { "Cache-Control": "public, max-age=60" } }
    );
  } catch (error) {
    console.error("recordings/keys failed:", error);
    return NextResponse.json({ keys: [] }, { status: 200 });
  }
};
