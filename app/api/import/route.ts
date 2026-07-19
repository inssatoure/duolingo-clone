import { type NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { challengeOptions, challenges, lessons } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

/**
 * Bulk CSV import for lessons/challenges/challengeOptions within an
 * existing unit.
 *
 * Expected JSON body: { unitId: number, rows: ImportRow[] }
 * where each row is one CSV row already parsed by papaparse on the client,
 * using the columns documented in seeds/csv-import-template.csv:
 *
 *   lesson_title, lesson_order, challenge_type, question, challenge_order,
 *   option_text, option_correct, option_image_src, option_audio_src
 *
 * Rows are grouped by (lesson_title, lesson_order) to form lessons, then by
 * (challenge_order, question, challenge_type) within a lesson to form
 * challenges, and each row becomes one challengeOption on that challenge.
 */

interface ImportRow {
  lesson_title: string;
  lesson_order: string | number;
  challenge_type: string;
  question: string;
  challenge_order: string | number;
  option_text: string;
  option_correct: string | boolean;
  option_image_src?: string;
  option_audio_src?: string;
}

const toBool = (v: string | boolean) => {
  if (typeof v === "boolean") return v;
  return ["true", "1", "yes", "correct"].includes(String(v).trim().toLowerCase());
};

export const POST = async (req: NextRequest) => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  const body = (await req.json()) as { unitId: number; rows: ImportRow[] };
  const { unitId, rows } = body;

  if (!unitId || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json(
      { error: "unitId and a non-empty rows array are required." },
      { status: 400 }
    );
  }

  const unit = await db.query.units.findFirst({ where: (u, { eq }) => eq(u.id, unitId) });
  if (!unit) {
    return NextResponse.json({ error: `Unit ${unitId} not found.` }, { status: 404 });
  }

  // Validate rows before writing anything.
  const errors: string[] = [];
  rows.forEach((row, i) => {
    if (!row.lesson_title) errors.push(`Row ${i + 2}: missing lesson_title`);
    if (!row.challenge_type || !["SELECT", "ASSIST"].includes(row.challenge_type)) {
      errors.push(`Row ${i + 2}: challenge_type must be SELECT or ASSIST`);
    }
    if (!row.question) errors.push(`Row ${i + 2}: missing question`);
    if (!row.option_text) errors.push(`Row ${i + 2}: missing option_text`);
  });
  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
  }

  // Group rows -> lessons -> challenges -> options
  type ChallengeGroup = {
    type: "SELECT" | "ASSIST";
    question: string;
    order: number;
    options: { text: string; correct: boolean; imageSrc: string | null; audioSrc: string | null }[];
  };
  type LessonGroup = { title: string; order: number; challenges: Map<string, ChallengeGroup> };

  const lessonGroups = new Map<string, LessonGroup>();

  for (const row of rows) {
    const lessonKey = `${row.lesson_title}::${row.lesson_order}`;
    if (!lessonGroups.has(lessonKey)) {
      lessonGroups.set(lessonKey, {
        title: row.lesson_title,
        order: Number(row.lesson_order) || 1,
        challenges: new Map(),
      });
    }
    const lessonGroup = lessonGroups.get(lessonKey)!;

    const challengeKey = `${row.challenge_order}::${row.question}::${row.challenge_type}`;
    if (!lessonGroup.challenges.has(challengeKey)) {
      lessonGroup.challenges.set(challengeKey, {
        type: row.challenge_type as "SELECT" | "ASSIST",
        question: row.question,
        order: Number(row.challenge_order) || 1,
        options: [],
      });
    }
    lessonGroup.challenges.get(challengeKey)!.options.push({
      text: row.option_text,
      correct: toBool(row.option_correct),
      imageSrc: row.option_image_src || null,
      audioSrc: row.option_audio_src || null,
    });
  }

  const summary = { lessonsCreated: 0, challengesCreated: 0, optionsCreated: 0 };

  for (const lessonGroup of lessonGroups.values()) {
    const [insertedLesson] = await db
      .insert(lessons)
      .values({ unitId, title: lessonGroup.title, order: lessonGroup.order })
      .returning();
    summary.lessonsCreated += 1;

    for (const challengeGroup of lessonGroup.challenges.values()) {
      const [insertedChallenge] = await db
        .insert(challenges)
        .values({
          lessonId: insertedLesson.id,
          type: challengeGroup.type,
          question: challengeGroup.question,
          order: challengeGroup.order,
        })
        .returning();
      summary.challengesCreated += 1;

      await db.insert(challengeOptions).values(
        challengeGroup.options.map((o) => ({
          challengeId: insertedChallenge.id,
          text: o.text,
          correct: o.correct,
          imageSrc: o.imageSrc,
          audioSrc: o.audioSrc,
        }))
      );
      summary.optionsCreated += challengeGroup.options.length;
    }
  }

  return NextResponse.json({ ok: true, summary });
};
