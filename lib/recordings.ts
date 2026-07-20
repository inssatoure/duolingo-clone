import { sql } from "drizzle-orm";

import db from "@/db/drizzle";

let ensured = false;

/** Creates the recordings table on first use — no migration step needed. */
export const ensureRecordingsTable = async () => {
  if (ensured) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS recordings (
      id serial PRIMARY KEY,
      text_key text NOT NULL,
      lang text NOT NULL,
      mime text NOT NULL,
      data text NOT NULL,
      updated_at timestamp NOT NULL DEFAULT now(),
      UNIQUE (text_key, lang)
    )
  `);
  // Tracks which Gemini voice (if any) generated a Wolof recording, so the
  // admin can see and compare voices per word. NULL for native recordings
  // and Cloud TTS (fr/en) clips.
  await db.execute(sql`
    ALTER TABLE recordings ADD COLUMN IF NOT EXISTS voice text
  `);
  ensured = true;
};

export const normalizeKey = (text: string) =>
  text.trim().toLowerCase().normalize("NFC");
