import { isNotNull } from "drizzle-orm";

import db from "@/db/drizzle";
import * as schema from "@/db/schema";
import leaguesData from "@/seeds/leagues.json";
import shopItemsData from "@/seeds/shop-items.json";
import rawCourseData from "@/seeds/wolof-course.json";

interface SeedOption {
  text: string;
  correct: boolean;
  imageSrc?: string | null;
  audioSrc?: string | null;
}
interface SeedChallenge {
  type: string;
  question: string;
  order: number;
  options: SeedOption[];
}
interface SeedLesson {
  title: string;
  order: number;
  challenges: SeedChallenge[];
}
interface SeedUnit {
  title: string;
  description: string;
  order: number;
  lessons: SeedLesson[];
}
interface SeedCourseEntry {
  course: { title: string; imageSrc: string };
  units: SeedUnit[];
}
interface SeedFile {
  meta?: { version?: string; note?: string };
  courses?: SeedCourseEntry[];
  course?: { title: string; imageSrc: string };
  units?: SeedUnit[];
}

const courseData = rawCourseData as unknown as SeedFile;

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

/**
 * Replaces all course CONTENT (courses, units, lessons, challenges, options)
 * with the bundled seed data, using batched inserts so it completes within a
 * serverless function's time budget. User accounts, hearts, points, streaks,
 * purchases, friendships and leagues are preserved; only each user's active
 * course selection is reset (they pick a course again on next visit).
 *
 * Also seeds leagues and shop items if those tables are empty.
 */
export const seedCourseContent = async () => {
  const entries: SeedCourseEntry[] = courseData.courses
    ? courseData.courses
    : [{ course: courseData.course!, units: courseData.units! }];

  // Deleting a course cascades to userProgress rows via activeCourseId, which
  // would wipe hearts/points. Detach users from courses first to keep them.
  await db
    .update(schema.userProgress)
    .set({ activeCourseId: null })
    .where(isNotNull(schema.userProgress.activeCourseId));

  // Cascades: units -> lessons -> challenges -> options + challengeProgress.
  await db.delete(schema.courses);

  const counts = { courses: 0, units: 0, lessons: 0, challenges: 0, options: 0 };

  for (const entry of entries) {
    const [course] = await db
      .insert(schema.courses)
      .values([entry.course])
      .returning();
    counts.courses++;

    const insertedUnits = await db
      .insert(schema.units)
      .values(
        entry.units.map((u) => ({
          courseId: course.id,
          title: u.title,
          description: u.description,
          order: u.order,
        }))
      )
      .returning();
    counts.units += insertedUnits.length;
    const unitIdByOrder = new Map(insertedUnits.map((u) => [u.order, u.id]));

    const lessonRows = entry.units.flatMap((u) =>
      u.lessons.map((l) => ({
        unitId: unitIdByOrder.get(u.order)!,
        title: l.title,
        order: l.order,
        seed: l,
      }))
    );
    const insertedLessons = await db
      .insert(schema.lessons)
      .values(lessonRows.map((r) => ({ unitId: r.unitId, title: r.title, order: r.order })))
      .returning();
    counts.lessons += insertedLessons.length;

    // Match lessons to seed data by stable key (unitId, order) since .returning()
    // order is not guaranteed by SQL. Build a map from key to lessonId.
    const lessonIdByKey = new Map<string, number>();
    insertedLessons.forEach((lesson) => {
      const key = `${lesson.unitId}:${lesson.order}`;
      lessonIdByKey.set(key, lesson.id);
    });

    const challengeRows = lessonRows.flatMap((lessonRow) =>
      lessonRow.seed.challenges.map((c) => ({
        lessonId: lessonIdByKey.get(`${lessonRow.unitId}:${lessonRow.order}`)!,
        type: c.type as "SELECT" | "ASSIST",
        question: c.question,
        order: c.order,
        seed: c,
      }))
    );

    // Store challenge metadata (lessonId, order) to align options with challenges.
    // We'll match by this key after insertion.
    const insertedChallenges: { id: number; lessonId: number; order: number }[] = [];
    for (const batch of chunk(challengeRows, 500)) {
      const inserted = await db
        .insert(schema.challenges)
        .values(batch.map((r) => ({ lessonId: r.lessonId, type: r.type, question: r.question, order: r.order })))
        .returning({ id: schema.challenges.id, lessonId: schema.challenges.lessonId, order: schema.challenges.order });
      insertedChallenges.push(...inserted);
    }
    counts.challenges += insertedChallenges.length;

    // Match challenges to seed data by stable key (lessonId, order).
    const challengeIdByKey = new Map<string, number>();
    insertedChallenges.forEach((challenge) => {
      const key = `${challenge.lessonId}:${challenge.order}`;
      challengeIdByKey.set(key, challenge.id);
    });

    const optionRows = challengeRows.flatMap((challengeRow) =>
      challengeRow.seed.options.map((o) => ({
        challengeId: challengeIdByKey.get(`${challengeRow.lessonId}:${challengeRow.order}`)!,
        text: o.text,
        correct: o.correct,
        imageSrc: o.imageSrc ?? null,
        audioSrc: o.audioSrc ?? null,
      }))
    );
    for (const batch of chunk(optionRows, 1000)) {
      await db.insert(schema.challengeOptions).values(batch);
      counts.options += batch.length;
    }
  }

  // Leagues and shop items: only fill them if missing, never wipe.
  const existingLeagues = await db.query.weeklyLeagues.findMany({ limit: 1 });
  if (existingLeagues.length === 0)
    await db
      .insert(schema.weeklyLeagues)
      .values((leaguesData as { leagues: (typeof schema.weeklyLeagues.$inferInsert)[] }).leagues);

  const existingShopItems = await db.query.shopItems.findMany({ limit: 1 });
  if (existingShopItems.length === 0)
    await db
      .insert(schema.shopItems)
      .values((shopItemsData as { items: (typeof schema.shopItems.$inferInsert)[] }).items);

  return { counts, seedVersion: courseData.meta?.version ?? "unknown" };
};
