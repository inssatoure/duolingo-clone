import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "./schema";

// Lazily construct the Neon client on first real use instead of at module
// load. Next.js evaluates every route module during the build's "collecting
// page data" step, including ones unrelated to the current change (e.g.
// Stripe webhooks) - if DATABASE_URL is missing for that build's environment
// (e.g. a Preview deployment that only has Production env vars), an eager
// `neon(undefined)` call crashes the entire build. Deferring the throw to
// query time keeps unrelated routes buildable and only fails when a request
// actually needs the database.
let cached: NeonHttpDatabase<typeof schema> | null = null;

const getDb = (): NeonHttpDatabase<typeof schema> => {
  if (!cached) {
    if (!process.env.DATABASE_URL)
      throw new Error(
        "DATABASE_URL is not set for this environment. Configure it in Vercel (Project Settings -> Environment Variables) for Production and/or Preview."
      );
    cached = drizzle(neon(process.env.DATABASE_URL), { schema });
  }
  return cached;
};

const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export default db;
