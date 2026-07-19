import { sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { getIsAdmin } from "@/lib/admin";
import { ensureRecordingsTable, normalizeKey } from "@/lib/recordings";

export const maxDuration = 30;

/** Admin: list which (textKey, lang) pairs already have a recording. */
export const GET = async () => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  await ensureRecordingsTable();
  const rows = (await db.execute(
    sql`SELECT text_key, lang, updated_at FROM recordings`
  )) as unknown as { rows: { text_key: string; lang: string }[] };

  return NextResponse.json({ recorded: rows.rows ?? rows });
};

/** Admin: upload/replace a recording. Body: { text, lang, mime, dataBase64 } */
export const POST = async (req: NextRequest) => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  const body = (await req.json()) as {
    text?: string;
    lang?: string;
    mime?: string;
    dataBase64?: string;
  };

  if (!body.text || !body.lang || !body.mime || !body.dataBase64)
    return new NextResponse("Missing fields.", { status: 400 });
  if (!["wo", "fr", "en"].includes(body.lang))
    return new NextResponse("Invalid lang.", { status: 400 });
  // ~5MB base64 cap per clip
  if (body.dataBase64.length > 5_000_000)
    return new NextResponse("Recording too large.", { status: 413 });

  await ensureRecordingsTable();
  const key = normalizeKey(body.text);

  await db.execute(sql`
    INSERT INTO recordings (text_key, lang, mime, data, updated_at)
    VALUES (${key}, ${body.lang}, ${body.mime}, ${body.dataBase64}, now())
    ON CONFLICT (text_key, lang)
    DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data, updated_at = now()
  `);

  return NextResponse.json({ ok: true, textKey: key, lang: body.lang });
};

/** Admin: delete a recording. Body: { text, lang } */
export const DELETE = async (req: NextRequest) => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  const body = (await req.json()) as { text?: string; lang?: string };
  if (!body.text || !body.lang)
    return new NextResponse("Missing fields.", { status: 400 });

  await ensureRecordingsTable();
  await db.execute(
    sql`DELETE FROM recordings WHERE text_key = ${normalizeKey(body.text)} AND lang = ${body.lang}`
  );
  return NextResponse.json({ ok: true });
};
