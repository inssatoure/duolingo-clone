import { isNotNull } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { readFileSync } from "fs";
import { join } from "path";

import * as schema from "@/db/schema";

const sql = neon(process.env.DATABASE_URL);

const db = drizzle(sql, { schema });

const main = async () => {
  try {
    // Check for --force flag. Without it, print plan and exit.
    const forceIndex = process.argv.indexOf("--force");
    const force = forceIndex !== -1;

    console.log("Database reset plan:");
    console.log("  DELETE: challengeOptions, challenges, lessons, units, courses");
    console.log("  DELETE: weeklyLeagues, shopItems");
    console.log("  PRESERVE: userProgress, challengeProgress, userStreaks, userSubscription");
    console.log("  PRESERVE: userPurchases, userLeagueParticipation, friendships");
    console.log("");

    if (!force) {
      console.log("Run with --force to execute. Dry run only.");
      return;
    }

    console.log("Seeding database (--force detected)");

    // Detach userProgress from courses before deleting to avoid FK issues.
    // Note: neon-http does not guarantee atomic transactions; we delete
    // in sequential order and handle FKs explicitly.
    console.log("Nulling out activeCourseId to detach users from courses...");
    await db
      .update(schema.userProgress)
      .set({ activeCourseId: null })
      .where(isNotNull(schema.userProgress.activeCourseId));

    // Delete content in FK order: children before parents.
    // Do NOT use Promise.all; FKs may be enforced and order matters.
    console.log("Deleting challengeOptions...");
    await db.delete(schema.challengeOptions);

    console.log("Deleting challenges...");
    await db.delete(schema.challenges);

    console.log("Deleting lessons...");
    await db.delete(schema.lessons);

    console.log("Deleting units...");
    await db.delete(schema.units);

    console.log("Deleting courses...");
    await db.delete(schema.courses);

    console.log("Deleting weeklyLeagues...");
    await db.delete(schema.weeklyLeagues);

    console.log("Deleting shopItems...");
    await db.delete(schema.shopItems);

    // Preserve user data: do NOT delete userProgress, challengeProgress,
    // userStreaks, userSubscription, userPurchases, userLeagueParticipation, friendships.

    // Seed leagues from JSON
    console.log("Seeding leagues...");
    const leaguesData = JSON.parse(
      readFileSync(join(process.cwd(), "seeds/leagues.json"), "utf-8")
    );
    await db.insert(schema.weeklyLeagues).values(leaguesData.leagues);

    // Seed shop items from JSON
    console.log("Seeding shop items...");
    const shopItemsData = JSON.parse(
      readFileSync(join(process.cwd(), "seeds/shop-items.json"), "utf-8")
    );
    await db.insert(schema.shopItems).values(shopItemsData.items);

    // Seed Wolof course from JSON
    console.log("Seeding Wolof course...");
    const wolofCourseData = JSON.parse(
      readFileSync(join(process.cwd(), "seeds/wolof-course.json"), "utf-8")
    );
    
    console.log(`Wolof seed meta: ${wolofCourseData.meta.note}`);

    // Support both the legacy single-course shape ({ course, units }) and
    // the current multi-course shape ({ courses: [{ course, units }, ...] })
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
      course: typeof schema.courses.$inferInsert;
      units: SeedUnit[];
    }

    const courseEntries: SeedCourseEntry[] = wolofCourseData.courses
      ? wolofCourseData.courses
      : [{ course: wolofCourseData.course, units: wolofCourseData.units }];

    for (const entry of courseEntries) {
      console.log(`Seeding course: ${entry.course.title}`);

      const courses = await db
        .insert(schema.courses)
        .values([entry.course])
        .returning();

      // For each course, insert units
      for (const course of courses) {
        for (const unitData of entry.units) {
        const units = await db
          .insert(schema.units)
          .values([
            {
              courseId: course.id,
              title: unitData.title,
              description: unitData.description,
              order: unitData.order,
            },
          ])
          .returning();

        // For each unit, insert lessons
        for (const unit of units) {
          for (const lessonData of unitData.lessons) {
            const lessons = await db
              .insert(schema.lessons)
              .values([
                {
                  unitId: unit.id,
                  title: lessonData.title,
                  order: lessonData.order,
                },
              ])
              .returning();

            // For each lesson, insert challenges
            for (const lesson of lessons) {
              for (const challengeData of lessonData.challenges) {
                const challenges = await db
                  .insert(schema.challenges)
                  .values([
                    {
                      lessonId: lesson.id,
                      type: challengeData.type as "SELECT" | "ASSIST",
                      question: challengeData.question,
                      order: challengeData.order,
                    },
                  ])
                  .returning();

                // For each challenge, insert challenge options
                for (const challenge of challenges) {
                  await db
                    .insert(schema.challengeOptions)
                    .values(
                      challengeData.options.map((option: SeedOption) => ({
                        challengeId: challenge.id,
                        text: option.text,
                        correct: option.correct,
                        imageSrc: option.imageSrc || null,
                        audioSrc: option.audioSrc || null,
                      }))
                    );
                }
              }
            }
          }
        }
      }
      }
    }

    console.log("Database seeded successfully");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to seed database");
  }
};

void main();
