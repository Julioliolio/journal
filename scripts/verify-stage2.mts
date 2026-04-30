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

const tables = await c.execute(
  `SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`,
);
const indexes = await c.execute(
  `SELECT name, tbl_name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
);
const partnersSchema = await c.execute(`PRAGMA table_info(partners)`);
const cardsSchema = await c.execute(`PRAGMA table_info(cards)`);

console.log("tables:", tables.rows.map((r) => r.name));
console.log("indexes:", indexes.rows);
console.log("partners cols:", partnersSchema.rows.map((r) => `${r.name}:${r.type}`));
console.log("cards cols:", cardsSchema.rows.map((r) => `${r.name}:${r.type}`));

// Reset state, then exercise CRUD + unique constraint at the DB level.
await c.execute("DELETE FROM cards");
await c.execute("DELETE FROM partners");

await c.execute({
  sql: "INSERT INTO partners (id, name1, name2, created_at) VALUES (?, ?, ?, ?)",
  args: [1, "Alex", "Sam", Math.floor(Date.now() / 1000)],
});

const today = new Date().toISOString().slice(0, 10);
const now = Math.floor(Date.now() / 1000);

async function insertCard(values: {
  id: string;
  type: string;
  position: number;
  text?: string;
  reflectionDid?: string;
}): Promise<void> {
  await c.execute({
    sql: `INSERT INTO cards
      (id, person_key, date, type, text, reflection_did, position, created_at, updated_at)
      VALUES (?, 'name1', ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      values.id,
      today,
      values.type,
      values.text ?? null,
      values.reflectionDid ?? null,
      values.position,
      now,
      now,
    ],
  });
}

await insertCard({ id: "n1", type: "note", position: 1, text: "first" });
await insertCard({ id: "n2", type: "note", position: 2, text: "second" });
await insertCard({
  id: "r1",
  type: "reflection",
  position: 3,
  reflectionDid: "shipped stage 2",
});

// Unique reflection per day must reject a second reflection.
let uniqueRejected = false;
try {
  await insertCard({
    id: "r2",
    type: "reflection",
    position: 4,
    reflectionDid: "should fail",
  });
} catch (error) {
  uniqueRejected = /UNIQUE/i.test(String(error));
}

const cardsBack = await c.execute(
  `SELECT id, type, text, reflection_did, position FROM cards
   WHERE person_key = 'name1' AND date = ?
   ORDER BY position DESC`,
  [today],
);
console.log("cards (DESC):", cardsBack.rows);

// Update + verify.
await c.execute({
  sql: "UPDATE cards SET text = ?, updated_at = ? WHERE id = ?",
  args: ["first (edited)", Math.floor(Date.now() / 1000), "n1"],
});
const after = await c.execute("SELECT text FROM cards WHERE id = 'n1'");
console.log("updated n1.text =", after.rows[0]?.text);

// Position swap (n1 ↔ n2).
await c.execute("UPDATE cards SET position = 99 WHERE id = 'n1'");
await c.execute("UPDATE cards SET position = 1 WHERE id = 'n2'");
await c.execute("UPDATE cards SET position = 2 WHERE id = 'n1'");
const swapped = await c.execute(
  `SELECT id, position FROM cards
   WHERE person_key = 'name1' AND date = ?
   ORDER BY position DESC`,
  [today],
);
console.log("after swap:", swapped.rows);

// Delete + verify.
await c.execute("DELETE FROM cards WHERE id = 'n2'");
const remaining = await c.execute(
  "SELECT COUNT(*) AS n FROM cards WHERE person_key = 'name1' AND date = ?",
  [today],
);
console.log("remaining count:", remaining.rows[0]?.n);

console.log(
  uniqueRejected
    ? "OK unique reflection constraint enforced"
    : "FAIL unique reflection NOT enforced",
);

// Clean up so the dev environment starts blank.
await c.execute("DELETE FROM cards");
await c.execute("DELETE FROM partners");

c.close();
