import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL;

if (!url) {
  throw new Error(
    "TURSO_DATABASE_URL is not set. For local dev, set it to file:./local.db",
  );
}

const isFile = url.startsWith("file:");

const client = createClient(
  isFile ? { url } : { url, authToken: process.env.TURSO_AUTH_TOKEN },
);

export const db = drizzle(client, { schema });
export type DB = typeof db;
