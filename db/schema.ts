import { boolean, index, integer, pgTable, serial, text } from "drizzle-orm/pg-core";

const timestamp = () =>
  text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString());

export const forumTopics = pgTable(
  "forum_topics",
  {
    id: serial("id").primaryKey(),
    forumSlug: text("forum_slug").notNull(),
    title: text("title").notNull(),
    authorName: text("author_name").notNull(),
    authorEmail: text("author_email").notNull(),
    pinned: boolean("pinned").notNull().default(false),
    commentsAllowed: boolean("comments_allowed").notNull().default(true),
    createdAt: timestamp(),
  },
  (table) => ({
    forumSlugIdx: index("forum_topics_forum_slug_idx").on(table.forumSlug),
  })
);

export const forumPosts = pgTable(
  "forum_posts",
  {
    id: serial("id").primaryKey(),
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
