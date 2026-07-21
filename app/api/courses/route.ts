import { type NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { courses } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";
import { adminListResponse } from "@/lib/admin-list";

export const GET = async (req: NextRequest) => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  return adminListResponse(req, courses, "courses");
};

export const POST = async (req: NextRequest) => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  const body = (await req.json()) as Partial<typeof courses.$inferInsert>;

  const data = await db
    .insert(courses)
    .values({
      title: body.title as string,
      imageSrc: body.imageSrc as string,
    })
    .returning();

  return NextResponse.json(data[0]);
};
