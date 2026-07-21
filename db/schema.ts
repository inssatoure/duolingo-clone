import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { MAX_HEARTS } from "@/constants";

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  imageSrc: text("image_src").notNull(),
});

export const coursesRelations = relations(courses, ({ many }) => ({
  userProgress: many(userProgress),
  units: many(units),
}));

export const units = pgTable(
  "units",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(), // Unit 1
    description: text("description").notNull(), // Learn the basics of spanish
    courseId: integer("course_id")
      .references(() => courses.id, {
        onDelete: "cascade",
      })
      .notNull(),
    order: integer("order").notNull(),
  },
  (table) => [index("units_course_id_idx").on(table.courseId)]
);

export const unitsRelations = relations(units, ({ many, one }) => ({
  course: one(courses, {
    fields: [units.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessons = pgTable(
  "lessons",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    unitId: integer("unit_id")
      .references(() => units.id, {
        onDelete: "cascade",
      })
      .notNull(),
    order: integer("order").notNull(),
  },
  (table) => [index("lessons_unit_id_idx").on(table.unitId)]
);

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  unit: one(units, {
    fields: [lessons.unitId],
    references: [units.id],
  }),
  challenges: many(challenges),
}));

export const challengesEnum = pgEnum("type", ["SELECT", "ASSIST"]);

export const challenges = pgTable(
  "challenges",
  {
    id: serial("id").primaryKey(),
    lessonId: integer("lesson_id")
      .references(() => lessons.id, {
        onDelete: "cascade",
      })
      .notNull(),
    type: challengesEnum("type").notNull(),
    question: text("question").notNull(),
    order: integer("order").notNull(),
  },
  (table) => [index("challenges_lesson_id_idx").on(table.lessonId)]
);

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [challenges.lessonId],
    references: [lessons.id],
  }),
  challengeOptions: many(challengeOptions),
  challengeProgress: many(challengeProgress),
}));

export const challengeOptions = pgTable(
  "challenge_options",
  {
    id: serial("id").primaryKey(),
    challengeId: integer("challenge_id")
      .references(() => challenges.id, {
        onDelete: "cascade",
      })
      .notNull(),
    text: text("text").notNull(),
    correct: boolean("correct").notNull(),
    imageSrc: text("image_src"),
    audioSrc: text("audio_src"),
  },
  (table) => [
    index("challenge_options_challenge_id_idx").on(table.challengeId),
  ]
);

export const challengeOptionsRelations = relations(
  challengeOptions,
  ({ one }) => ({
    challenge: one(challenges, {
      fields: [challengeOptions.challengeId],
      references: [challenges.id],
    }),
  })
);

export const challengeProgress = pgTable(
  "challenge_progress",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    challengeId: integer("challenge_id")
      .references(() => challenges.id, {
        onDelete: "cascade",
      })
      .notNull(),
    completed: boolean("completed").notNull().default(false),
  },
  (table) => [
    index("challenge_progress_user_id_idx").on(table.userId),
    uniqueIndex("challenge_progress_user_id_challenge_id_key").on(
      table.userId,
      table.challengeId
    ),
  ]
);

export const challengeProgressRelations = relations(
  challengeProgress,
  ({ one }) => ({
    challenge: one(challenges, {
      fields: [challengeProgress.challengeId],
      references: [challenges.id],
    }),
  })
);

export const userProgress = pgTable(
  "user_progress",
  {
    userId: text("user_id").primaryKey(),
    userName: text("user_name").notNull().default("User"),
    userImageSrc: text("user_image_src").notNull().default("/mascot.png"),
    // set null (not cascade): deleting a course must never delete user rows.
    // Consumers (db/queries.ts: getUnits, getCourseProgress, etc.) already
    // treat a null activeCourseId as "no active course".
    activeCourseId: integer("active_course_id").references(() => courses.id, {
      onDelete: "set null",
    }),
    hearts: integer("hearts").notNull().default(MAX_HEARTS),
    points: integer("points").notNull().default(0),
    cfaBalance: integer("cfa_balance").notNull().default(0),
    leagueId: integer("league_id").references(() => weeklyLeagues.id),
  },
  (table) => [
    index("user_progress_active_course_id_idx").on(table.activeCourseId),
    index("user_progress_league_id_idx").on(table.leagueId),
    index("user_progress_points_idx").on(table.points.desc()),
  ]
);

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  activeCourse: one(courses, {
    fields: [userProgress.activeCourseId],
    references: [courses.id],
  }),
  league: one(weeklyLeagues, {
    fields: [userProgress.leagueId],
    references: [weeklyLeagues.id],
  }),
}));

export const userSubscription = pgTable("user_subscription", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id").notNull().unique(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  stripePriceId: text("stripe_price_id").notNull(),
  stripeCurrentPeriodEnd: timestamp("stripe_current_period_end").notNull(),
});

export const userStreaks = pgTable("user_streaks", {
  userId: text("user_id").primaryKey().references(() => userProgress.userId),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastPracticeDate: timestamp("last_practice_date"),
  streakFreezeActive: boolean("streak_freeze_active").notNull().default(false),
  streakFreezeUntil: timestamp("streak_freeze_until"),
});

export const userStreaksRelations = relations(userStreaks, ({ one }) => ({
  user: one(userProgress, {
    fields: [userStreaks.userId],
    references: [userProgress.userId],
  }),
}));

export const weeklyLeagues = pgTable("weekly_leagues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  minRank: integer("min_rank").notNull(),
  maxRank: integer("max_rank").notNull(),
  iconSrc: text("icon_src").notNull(),
  color: text("color").notNull(),
});

export const weeklyLeaguesRelations = relations(weeklyLeagues, ({ many }) => ({
  users: many(userProgress),
  participations: many(userLeagueParticipation),
}));

export const userLeagueParticipation = pgTable(
  "user_league_participation",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => userProgress.userId),
    leagueId: integer("league_id")
      .notNull()
      .references(() => weeklyLeagues.id),
    weekStart: timestamp("week_start").notNull(),
    weekEnd: timestamp("week_end").notNull(),
    xpEarned: integer("xp_earned").notNull().default(0),
    rank: integer("rank").notNull(),
    promoted: boolean("promoted").notNull().default(false),
    relegated: boolean("relegated").notNull().default(false),
  },
  (table) => [
    index("user_league_participation_user_id_idx").on(table.userId),
    index("user_league_participation_league_id_idx").on(table.leagueId),
    index("user_league_participation_league_week_idx").on(
      table.leagueId,
      table.weekStart
    ),
  ]
);

export const userLeagueParticipationRelations = relations(
  userLeagueParticipation,
  ({ one }) => ({
    user: one(userProgress, {
      fields: [userLeagueParticipation.userId],
      references: [userProgress.userId],
    }),
    league: one(weeklyLeagues, {
      fields: [userLeagueParticipation.leagueId],
      references: [weeklyLeagues.id],
    }),
  })
);

export const friendships = pgTable(
  "friendships",
  {
    id: serial("id").primaryKey(),
    requesterId: text("requester_id")
      .notNull()
      .references(() => userProgress.userId),
    receiverId: text("receiver_id")
      .notNull()
      .references(() => userProgress.userId),
    status: text("status").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("friendships_requester_id_idx").on(table.requesterId),
    index("friendships_receiver_id_idx").on(table.receiverId),
  ]
);

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  requester: one(userProgress, {
    fields: [friendships.requesterId],
    references: [userProgress.userId],
  }),
  receiver: one(userProgress, {
    fields: [friendships.receiverId],
    references: [userProgress.userId],
  }),
}));

export const shopItems = pgTable("shop_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  type: text("type").notNull(),
  iconSrc: text("icon_src").notNull(),
  active: boolean("active").notNull().default(true),
});

export const shopItemsRelations = relations(shopItems, ({ many }) => ({
  purchases: many(userPurchases),
}));

export const userPurchases = pgTable(
  "user_purchases",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => userProgress.userId),
    itemId: integer("item_id").notNull().references(() => shopItems.id),
    purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
  },
  (table) => [
    index("user_purchases_user_id_idx").on(table.userId),
    index("user_purchases_item_id_idx").on(table.itemId),
  ]
);

export const userPurchasesRelations = relations(userPurchases, ({ one }) => ({
  user: one(userProgress, {
    fields: [userPurchases.userId],
    references: [userProgress.userId],
  }),
  item: one(shopItems, {
    fields: [userPurchases.itemId],
    references: [shopItems.id],
  }),
}));

// Our own PIN storage, bypassing Clerk's password system entirely (Clerk
// enforces a hard minimum password length we can't lower below what's
// workable for a 4-digit child-friendly PIN). No FK to userProgress: this
// row is created at registration, before any userProgress row exists.
export const userPins = pgTable("user_pins", {
  userId: text("user_id").primaryKey(),
  pinHash: text("pin_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Native-speaker audio recordings, keyed by the exact display text so lessons
// can look up audio for any option or question without reseeding.
export const recordings = pgTable(
  "recordings",
  {
    id: serial("id").primaryKey(),
    textKey: text("text_key").notNull(),
    lang: text("lang").notNull(), // "wo" | "fr" | "en"
    mime: text("mime").notNull(),
    data: text("data").notNull(), // base64-encoded audio
    // Tracks which Gemini voice (if any) generated a Wolof recording, so the
    // admin can see and compare voices per word. NULL for native recordings
    // and Cloud TTS (fr/en) clips.
    voice: text("voice"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("recordings_text_key_idx").on(table.textKey),
    unique("recordings_text_key_lang_key").on(table.textKey, table.lang),
  ]
);
