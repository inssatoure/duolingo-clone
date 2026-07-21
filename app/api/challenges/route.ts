import { type NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { challenges } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";
import { adminListResponse } from "@/lib/admin-list";

export const GET = async (req: NextRequest) => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  return adminListResponse(req, challenges, "challenges");
};

export const POST = async (req: NextRequest) => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  const body = (await req.json()) as Partial<typeof challenges.$inferInsert>;

  if (body.type !== "SELECT" && body.type !== "ASSIST") {
    return new NextResponse("Invalid challenge type.", { status: 400 });
  }

  const data = await db
    .insert(challenges)
    .values({
      lessonId: Number(body.lessonId),
      type: body.type,
      question: body.question as string,
      order: Number(body.order),
    })
    .returning();

  return NextResponse.json(data[0]);
};
