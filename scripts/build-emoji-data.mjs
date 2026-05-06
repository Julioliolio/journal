#!/usr/bin/env node
// Regenerates lib/emoji-data.ts from public Unicode CLDR-derived datasets.
// Run with: node scripts/build-emoji-data.mjs

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "lib/emoji-data.ts");

const GROUPS_URL =
  "https://raw.githubusercontent.com/muan/unicode-emoji-json/main/data-by-group.json";
const KEYWORDS_URL =
  "https://raw.githubusercontent.com/muan/emojilib/main/dist/emoji-en-US.json";

const [groups, keywords] = await Promise.all([
  fetch(GROUPS_URL).then((r) => r.json()),
  fetch(KEYWORDS_URL).then((r) => r.json()),
]);

const out = groups.map((g) => ({
  n: g.name,
  e: g.emojis.map((em) => {
    const kws = keywords[em.emoji] ?? [];
    const baseTerms = new Set([
      ...em.name.toLowerCase().split(/\s+/),
      ...em.slug.replace(/_/g, " ").toLowerCase().split(/\s+/),
    ]);
    const extra = [];
    for (const k of kws) {
      const tok = k.toLowerCase();
      if (baseTerms.has(tok)) continue;
      if (/^[a-z0-9:_;()*-]+$/.test(tok)) extra.push(tok);
      baseTerms.add(tok);
    }
    return { e: em.emoji, n: em.name, k: extra.join(" ") };
  }),
}));

const header =
  "// AUTO-GENERATED — regenerate with `node scripts/build-emoji-data.mjs`\n" +
  "// Source: muan/unicode-emoji-json + muan/emojilib (CLDR-derived).\n\n" +
  "export type EmojiEntry = { e: string; n: string; k: string };\n" +
  "export type EmojiGroup = { n: string; e: EmojiEntry[] };\n\n" +
  "export const EMOJI_GROUPS: EmojiGroup[] = ";

writeFileSync(OUT, header + JSON.stringify(out) + ";\n");
console.log(`Wrote ${OUT} (${out.reduce((n, g) => n + g.e.length, 0)} emojis)`);
