// Client-safe: no server-only imports (db, etc). Kept separate from
// lib/recordings.ts so client components (e.g. lib/audio-client.ts) can
// import just the key-normalization logic without pulling in Drizzle/Neon.
export const normalizeKey = (text: string) =>
  text.trim().toLowerCase().normalize("NFC");
