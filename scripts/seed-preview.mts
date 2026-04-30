import { existsSync, readFileSync } from "node:fs";

import { createClient } from "@libsql/client";
import { customAlphabet } from "nanoid";

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

const newId = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  16,
);

const c = createClient({ url: process.env.TURSO_DATABASE_URL! });

await c.execute("DELETE FROM cards");

const partnersRows = await c.execute("SELECT name1, name2 FROM partners LIMIT 1");
if (partnersRows.rows.length === 0) {
  await c.execute({
    sql: "INSERT INTO partners (id, name1, name2, created_at) VALUES (?, ?, ?, ?)",
    args: [1, "Julio", "Sam", Math.floor(Date.now() / 1000)],
  });
  console.log("created partners Julio + Sam");
}

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// Day 0 = today, Day 6 = a week ago.
const days = [0, 1, 2, 3, 4, 5, 6].map(isoDaysAgo);

type Seed = {
  person: "name1" | "name2";
  daysAgo: number;
  type: "note" | "reflection" | "image" | "note_image";
  text?: string;
  imageUrl?: string;
  imageCaption?: string;
  did?: string;
  learned?: string;
  felt?: string;
};

const GIFS = {
  korea: "https://media.tenor.com/jzbVNPA9VHIAAAAj/korea-south-korea.gif",
  thisIsFine: "https://media.tenor.com/MYZgsN2TDJAAAAAM/this-is.gif",
  celebrate: "https://media.tenor.com/bhdatE0lYLoAAAAM/celebration-celebrating.gif",
  exhausted: "https://media.tenor.com/LoP18_o4D5AAAAAm/girl-exhausted.webp",
  ohNo: "https://media.tenor.com/LX1reyWcd8EAAAAM/oopsies-ohno.gif",
};

const seeds: Seed[] = [
  // a week ago
  {
    person: "name1",
    daysAgo: 6,
    type: "note",
    text: "the mango trees on the corner are doing their thing again. one of those weeks lol",
  },
  {
    person: "name2",
    daysAgo: 6,
    type: "note",
    text: "shipped the auth thing before lunch??? who am i",
  },
  {
    person: "name2",
    daysAgo: 6,
    type: "note_image",
    imageUrl: GIFS.celebrate,
    text: "me when the tests passed first try",
  },
  {
    person: "name2",
    daysAgo: 6,
    type: "reflection",
    did: "merged the auth pr finally",
    learned: "one cookie helper > seventeen scattered ones. obviously. why did i not do this sooner",
    felt: "relieved, then weirdly flat. anyway, beer time",
  },
  // 5 days ago
  {
    person: "name1",
    daysAgo: 5,
    type: "note",
    text: "called mom. still in tampa. she keeps asking when we're visiting and i keep saying soon like a liar",
  },
  // 4 days ago
  {
    person: "name1",
    daysAgo: 4,
    type: "note_image",
    imageUrl: GIFS.korea,
    text: "found this and i can't stop watching it. why is it so funny",
  },
  {
    person: "name1",
    daysAgo: 4,
    type: "note",
    text: "the new bakery on **palmer** is dangerous. cardamom bun. that's the whole note",
  },
  {
    person: "name1",
    daysAgo: 4,
    type: "reflection",
    did: "wrote the q3 plan. picked 2 bets, killed the other 4",
    learned: "if i can't say it in one sentence i don't believe it yet",
    felt: "clear-headed for once",
  },
  {
    person: "name2",
    daysAgo: 4,
    type: "note",
    text: "bumped into K at the market. we HAVE to feed them before berlin pls remind me",
  },
  // 3 days ago
  {
    person: "name1",
    daysAgo: 3,
    type: "note_image",
    imageUrl: GIFS.thisIsFine,
    text: "the inbox today",
  },
  {
    person: "name1",
    daysAgo: 3,
    type: "note",
    text: "ok one of those days. moving on",
  },
  {
    person: "name2",
    daysAgo: 3,
    type: "note",
    text: "watched the new wim wenders. slow on purpose. very into it. you'd hate it",
  },
  {
    person: "name2",
    daysAgo: 3,
    type: "reflection",
    did: "two backend interviews back-to-back",
    learned: "the second one asked sharper questions than i did. humbling lol",
    felt: "tired but in a good way",
  },
  // 2 days ago
  {
    person: "name1",
    daysAgo: 2,
    type: "note_image",
    imageUrl: GIFS.exhausted,
    text: "swim today. lungs went on strike",
  },
  {
    person: "name1",
    daysAgo: 2,
    type: "note",
    text: "canopy is UP. looks better than the mockup. low-key flexing on past me",
  },
  {
    person: "name2",
    daysAgo: 2,
    type: "note",
    text: "long lunch w/ R. they're thinking of bouncing from the firm and tbh? do it",
  },
  // yesterday
  {
    person: "name1",
    daysAgo: 1,
    type: "note",
    text: "took the afternoon off, read on the porch, didn't check slack once. 10/10",
  },
  {
    person: "name1",
    daysAgo: 1,
    type: "reflection",
    did: "rewrote the onboarding doc, deleted half of it",
    learned: "we kept telling people the *rules* and forgot to tell them the *why*",
    felt: "good. like, actually",
  },
  {
    person: "name2",
    daysAgo: 1,
    type: "note_image",
    imageUrl: GIFS.ohNo,
    imageCaption: "the chicken. RIP",
  },
  {
    person: "name2",
    daysAgo: 1,
    type: "note",
    text: "tested the new grill. corn = perfect. chicken = **aspirational**. we'll get there",
  },
  // today
  {
    person: "name1",
    daysAgo: 0,
    type: "note",
    text: "morning run, then standup. quietly proud of the week tbh",
  },
  {
    person: "name1",
    daysAgo: 0,
    type: "reflection",
    did: "shipped the seed + reviewed sam's pr",
    learned: "a week of dumb little notes adds up to like... actual signal? weird",
    felt: "warm",
  },
];

const now = Math.floor(Date.now() / 1000);
let inserted = 0;

// Group by (person, date) so we can assign positions in order.
const grouped = new Map<string, Seed[]>();
for (const s of seeds) {
  const key = `${s.person}__${days[s.daysAgo]!}`;
  const arr = grouped.get(key) ?? [];
  arr.push(s);
  grouped.set(key, arr);
}

for (const [key, list] of grouped) {
  const [, date] = key.split("__");
  let position = 0;
  for (const s of list) {
    position += 1;
    // Stagger created_at by an hour-ish so updatedAt makes sense.
    const offsetSeconds = s.daysAgo * 86400 + (list.length - position) * 3600;
    const createdAt = now - offsetSeconds;
    await c.execute({
      sql: `INSERT INTO cards (
        id, person_key, date, type,
        text, image_url, image_caption,
        reflection_did, reflection_learned, reflection_felt, reflection_felt_image_url,
        position, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        newId(),
        s.person,
        date!,
        s.type,
        s.text ?? null,
        s.imageUrl ?? null,
        s.imageCaption ?? null,
        s.did ?? null,
        s.learned ?? null,
        s.felt ?? null,
        null,
        position,
        createdAt,
        createdAt,
      ],
    });
    inserted += 1;
  }
}

console.log(
  `seeded ${inserted} cards across ${days.length} days (today=${days[0]}, week-ago=${days[6]})`,
);
c.close();
