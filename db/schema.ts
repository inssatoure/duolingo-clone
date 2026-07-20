import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
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

export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), // Unit 1
  description: text("description").notNull(), // Learn the basics of spanish
  courseId: integer("course_id")
    .references(() => courses.id, {
      onDelete: "cascade",
    })
    .notNull(),
  order: integer("order").notNull(),
});

export const unitsRelations = relations(units, ({ many, one }) => ({
  course: one(courses, {
    fields: [units.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  unitId: integer("unit_id")
    .references(() => units.id, {
      onDelete: "cascade",
    })
    .notNull(),
  order: integer("order").notNull(),
});

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  unit: one(units, {
    fields: [lessons.unitId],
    references: [units.id],
  }),
  challenges: many(challenges),
}));

export const challengesEnum = pgEnum("type", ["SELECT", "ASSIST"]);

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id")
    .references(() => lessons.id, {
      onDelete: "cascade",
    })
    .notNull(),
  type: challengesEnum("type").notNull(),
  question: text("question").notNull(),
  order: integer("order").notNull(),
});

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [challenges.lessonId],
    references: [lessons.id],
  }),
  challengeOptions: many(challengeOptions),
  challengeProgress: many(challengeProgress),
}));

export const challengeOptions = pgTable("challenge_options", {
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
});

export const challengeOptionsRelations = relations(
  challengeOptions,
  ({ one }) => ({
    challenge: one(challenges, {
      fields: [challengeOptions.challengeId],
      references: [challenges.id],
    }),
  })
);

export const challengeProgress = pgTable("challenge_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  challengeId: integer("challenge_id")
    .references(() => challenges.id, {
      onDelete: "cascade",
    })
    .notNull(),
  completed: boolean("completed").notNull().default(false),
});

export const challengeProgressRelations = relations(
  challengeProgress,
  ({ one }) => ({
    challenge: one(challenges, {
      fields: [challengeProgress.challengeId],
      references: [challenges.id],
    }),
  })
);

export const userProgress = pgTable("user_progress", {
  userId: text("user_id").primaryKey(),
  userName: text("user_name").notNull().default("User"),
  userImageSrc: text("user_image_src").notNull().default("/mascot.png"),
  activeCourseId: integer("active_course_id").references(() => courses.id, {
    onDelete: "cascade",
  }),
  hearts: integer("hearts").notNull().default(MAX_HEARTS),
  points: integer("points").notNull().default(0),
  cfaBalance: integer("cfa_balance").notNull().default(0),
  leagueId: integer("league_id").references(() => weeklyLeagues.id),
});

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

export const userLeagueParticipation = pgTable("user_league_participation", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => userProgress.userId),
  leagueId: integer("league_id").notNull().references(() => weeklyLeagues.id),
  weekStart: timestamp("week_start").notNull(),
  weekEnd: timestamp("week_end").notNull(),
  xpEarned: integer("xp_earned").notNull().default(0),
  rank: integer("rank").notNull(),
  promoted: boolean("promoted").notNull().default(false),
  relegated: boolean("relegated").notNull().default(false),
});

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

export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  requesterId: text("requester_id").notNull().references(() => userProgress.userId),
  receiverId: text("receiver_id").notNull().references(() => userProgress.userId),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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

export const userPurchases = pgTable("user_purchases", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => userProgress.userId),
  itemId: integer("item_id").notNull().references(() => shopItems.id),
  purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
});

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

// Native-speaker audio recordings, keyed by the exact display text so lessons
// can look up audio for any option or question without reseeding. Created at
// runtime by the recordings API (CREATE TABLE IF NOT EXISTS) so no migration
// step is needed.
export const recordings = pgTable("recordings", {
  id: serial("id").primaryKey(),
  textKey: text("text_key").notNull(),
  lang: text("lang").notNull(), // "wo" | "fr" | "en"
  mime: text("mime").notNull(),
  data: text("data").notNull(), // base64-encoded audio
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
