import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import db from "@/db/drizzle";
import { challenges } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) => {
  const { challengeId } = await params;

  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  const data = await db.query.challenges.findFirst({
    where: eq(challenges.id, Number(challengeId)),
  });

  return NextResponse.json(data);
};

export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) => {
  const { challengeId } = await params;

  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  const body = (await req.json()) as Partial<typeof challenges.$inferInsert>;

  if (
    body.type !== undefined &&
    body.type !== "SELECT" &&
    body.type !== "ASSIST"
  ) {
    return new NextResponse("Invalid challenge type.", { status: 400 });
  }

  const data = await db
    .update(challenges)
    .set({
      lessonId: body.lessonId !== undefined ? Number(body.lessonId) : undefined,
      type: body.type,
      question: body.question,
      order: body.order !== undefined ? Number(body.order) : undefined,
    })
    .where(eq(challenges.id, Number(challengeId)))
    .returning();

  return NextResponse.json(data[0]);
};

export const DELETE = async (
  _req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) => {
  const { challengeId } = await params;

  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  const data = await db
    .delete(challenges)
    .where(eq(challenges.id, Number(challengeId)))
    .returning();

  return NextResponse.json(data[0]);
};
