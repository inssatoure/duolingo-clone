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
