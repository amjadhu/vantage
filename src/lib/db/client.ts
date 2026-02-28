import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
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
