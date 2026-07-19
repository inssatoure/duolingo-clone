import { NextResponse } from "next/server";

import { getIsAdmin } from "@/lib/admin";
import { seedCourseContent } from "@/lib/seed-courses";

export const maxDuration = 60;

export const POST = async () => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  try {
    const result = await seedCourseContent();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Seed failed:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Seed failed" },
      { status: 500 }
    );
  }
};
