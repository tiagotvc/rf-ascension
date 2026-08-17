import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamp = () =>
  text("created_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`);

export const forumTopics = sqliteTable(
  "forum_topics",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    forumSlug: text("forum_slug").notNull(),
    title: text("title").notNull(),
    authorName: text("author_name").notNull(),
    authorEmail: text("author_email").notNull(),
    pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
    createdAt: timestamp(),
  },
  (table) => ({
    forumSlugIdx: index("forum_topics_forum_slug_idx").on(table.forumSlug),
  })
);

export const forumPosts = sqliteTable(
  "forum_posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    topicId: integer("topic_id")
      .notNull()
      .references(() => forumTopics.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    authorName: text("author_name").notNull(),
    authorEmail: text("author_email").notNull(),
    createdAt: timestamp(),
  },
  (table) => ({
    topicIdIdx: index("forum_posts_topic_id_idx").on(table.topicId),
  })
);
