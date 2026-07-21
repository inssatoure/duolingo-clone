import { type NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { challengeOptions } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";
import { adminListResponse } from "@/lib/admin-list";

export const GET = async (req: NextRequest) => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  return adminListResponse(req, challengeOptions, "challengeOptions");
};

export const POST = async (req: NextRequest) => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  const body = (await req.json()) as Partial<typeof challengeOptions.$inferInsert>;

  const data = await db
    .insert(challengeOptions)
    .values({
      challengeId: Number(body.challengeId),
      text: body.text as string,
      correct: Boolean(body.correct),
      imageSrc: body.imageSrc ?? null,
      audioSrc: body.audioSrc ?? null,
    })
    .returning();

  return NextResponse.json(data[0]);
};
