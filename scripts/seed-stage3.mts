import { existsSync, readFileSync } from "node:fs";

import { createClient } from "@libsql/client";

function loadEnvFile(path: string): void {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
    if (m && process.env[m[1]!] === undefined) {
      let v = m[2]!;
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      )
        v = v.slice(1, -1);
      process.env[m[1]!] = v;
    }
  }
}

loadEnvFile(".env.local");

const c = createClient({ url: process.env.TURSO_DATABASE_URL! });

await c.execute("DELETE FROM cards");
await c.execute("DELETE FROM partners");
await c.execute({
  sql: "INSERT INTO partners (id, name1, name2, created_at) VALUES (?, ?, ?, ?)",
  args: [1, "Alex", "Sam", Math.floor(Date.now() / 1000)],
});

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
const now = Math.floor(Date.now() / 1000);

const seed: {
  id: string;
  person: "name1" | "name2";
  date: string;
  type: "note" | "image" | "note_image" | "reflection";
  values: Record<string, string | null>;
  position: number;
}[] = [
  {
    id: "a1",
    person: "name1",
    date: yesterday,
    type: "note",
    values: { text: "first day. felt overwhelming but **good**." },
    position: 1,
  },
  {
    id: "a2",
    person: "name1",
    date: today,
    type: "note",
    values: { text: "shipped a thing today. proud." },
    position: 1,
  },
  {
    id: "a3",
    person: "name1",
    date: today,
    type: "reflection",
    values: {
      reflection_did: "wrote the schema",
      reflection_learned: "drizzle partial unique indexes are nicer than I thought",
      reflection_felt: "tired but satisfied",
    },
    position: 2,
  },
  {
    id: "b1",
    person: "name2",
    date: yesterday,
    type: "note",
    values: { text: "onboarding day. lots of names." },
    position: 1,
  },
];

for (const row of seed) {
  await c.execute({
    sql: `INSERT INTO cards (id, person_key, date, type, text, image_url, image_caption, reflection_did, reflection_learned, reflection_felt, position, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      row.id,
      row.person,
      row.date,
      row.type,
      row.values.text ?? null,
      row.values.image_url ?? null,
      row.values.image_caption ?? null,
      row.values.reflection_did ?? null,
      row.values.reflection_learned ?? null,
      row.values.reflection_felt ?? null,
      row.position,
      now,
      now,
    ],
  });
}

console.log(`seeded partners and ${seed.length} cards (today=${today}, yesterday=${yesterday})`);
c.close();
