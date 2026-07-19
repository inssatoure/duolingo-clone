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
  ensured = true;
};

export const normalizeKey = (text: string) =>
  text.trim().toLowerCase().normalize("NFC");
