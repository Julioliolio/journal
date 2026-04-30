import { existsSync, readFileSync } from "node:fs";

import { defineConfig } from "drizzle-kit";

function loadEnvFile(path: string): void {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line);
    if (!match) continue;
    const [, key, raw] = match;
    if (process.env[key!] !== undefined) continue;
    let value = raw!;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key!] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  throw new Error(
    "TURSO_DATABASE_URL is not set. For local dev, set it in .env.local (e.g. file:./local.db).",
  );
}

const isFile = url.startsWith("file:");

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: isFile ? "sqlite" : "turso",
  dbCredentials: isFile
    ? { url }
    : {
        url,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      },
});
