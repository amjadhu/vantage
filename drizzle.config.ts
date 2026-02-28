import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL || "file:local.db";
const isRemote = url.startsWith("libsql://");

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: isRemote ? "turso" : "sqlite",
  dbCredentials: {
    url,
    authToken: isRemote ? process.env.DATABASE_AUTH_TOKEN : undefined,
  },
});
