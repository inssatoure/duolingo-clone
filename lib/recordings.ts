import { sql } from "drizzle-orm";

import db from "@/db/drizzle";

export { normalizeKey } from "@/lib/recordings-key";

/**
 * The `recordings` table now lives in db/schema.ts (see WS-D migration) and
 * is created/altered via Drizzle migrations, not at runtime.
 *
 * This is kept as a no-op async shim so existing call sites in
 * app/api/recordings/* (owned by another workstream) don't need to change —
 * they still `await ensureRecordingsTable()` before querying.
 */
export const ensureRecordingsTable = async () => {
  return;
};

/** Shared upsert used by both the admin batch TTS tool and the on-demand
 * Wolof generation path, so the two never drift. */
export const upsertRecording = async (params: {
  textKey: string;
  lang: "fr" | "en" | "wo";
  mime: string;
  data: string;
  voice: string | null;
}) => {
  const { textKey, lang, mime, data, voice } = params;
  await db.execute(sql`
    INSERT INTO recordings (text_key, lang, mime, data, voice, updated_at)
    VALUES (${textKey}, ${lang}, ${mime}, ${data}, ${voice}, now())
    ON CONFLICT (text_key, lang)
    DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data, voice = EXCLUDED.voice, updated_at = now()
  `);
};
