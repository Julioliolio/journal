import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

// Singleton row, id always = 1. Name1 is the creator (set in /login/<token>).
// Name2..name4 are filled in when each subsequent person joins via the same
// secret link, so they are nullable until that moment.
export const partners = sqliteTable("partners", {
  id: integer("id").primaryKey().default(1),
  name1: text("name1").notNull(),
  name2: text("name2"),
  name3: text("name3"),
  name4: text("name4"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const cards = sqliteTable(
  "cards",
  {
    id: text("id").primaryKey(),
    personKey: text("person_key", {
      enum: ["name1", "name2", "name3", "name4"],
    }).notNull(),
    date: text("date").notNull(), // 'YYYY-MM-DD' in user's local TZ
    type: text("type", {
      enum: ["note", "image", "note_image", "reflection"],
    }).notNull(),

    // Content (subset populated based on type)
    text: text("text"),
    imageUrl: text("image_url"),
    imageCaption: text("image_caption"),
    reflectionDid: text("reflection_did"),
    reflectionLearned: text("reflection_learned"),
    reflectionFelt: text("reflection_felt"),
    reflectionFeltImageUrl: text("reflection_felt_image_url"),

    // Fractional, render DESC.
    position: real("position").notNull(),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("idx_cards_person_date_position").on(
      t.personKey,
      t.date,
      t.position,
    ),
    uniqueIndex("uniq_reflection_per_day")
      .on(t.personKey, t.date)
      .where(sql`${t.type} = 'reflection'`),
  ],
);

// Anonymous guest reactions. content is the emoji char or a GIPHY embed
// URL; width/height are only set for gif. Cascades on parent card delete.
export const reactions = sqliteTable(
  "reactions",
  {
    id: text("id").primaryKey(),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["emoji", "gif"] }).notNull(),
    content: text("content").notNull(),
    width: integer("width"),
    height: integer("height"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("idx_reactions_card_id_created").on(t.cardId, t.createdAt)],
);

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
export type Partners = typeof partners.$inferSelect;
export type Reaction = typeof reactions.$inferSelect;
export type NewReaction = typeof reactions.$inferInsert;
export type PersonKey = "name1" | "name2" | "name3" | "name4";
export const PERSON_KEYS: readonly PersonKey[] = [
  "name1",
  "name2",
  "name3",
  "name4",
] as const;
export type CardType = "note" | "image" | "note_image" | "reflection";
