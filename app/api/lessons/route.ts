import { type NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { lessons } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";
import { adminListResponse } from "@/lib/admin-list";

export const GET = async (req: NextRequest) => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  return adminListResponse(req, lessons, "lessons");
};

export const POST = async (req: NextRequest) => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  const body = (await req.json()) as typeof lessons.$inferSelect;

  const data = await db
    .insert(lessons)
    .values({
      ...body,
    })
    .returning();

  return NextResponse.json(data[0]);
};
