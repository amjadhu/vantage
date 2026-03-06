import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

function getClient() {
  const url = process.env.DATABASE_URL || "file:local.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  // Turso (remote) or local SQLite
  return createClient({
    url,
    authToken: authToken || undefined,
  });
}

const client = getClient();
export const db = drizzle(client, { schema });
export { schema };

// Run lightweight schema migrations on startup
let migrated = false;
export async function ensureMigrations() {
  if (migrated) return;
  migrated = true;
  try {
    await db.run(sql`ALTER TABLE briefings ADD COLUMN type TEXT NOT NULL DEFAULT 'tech'`);
  } catch {
    // Column already exists
  }
}
