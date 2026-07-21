import { type NextRequest, NextResponse } from "next/server";

import { getIsAdmin } from "@/lib/admin";
import { seedCourseContent } from "@/lib/seed-courses";

export const maxDuration = 60;

// Full content wipe: require an explicit confirmation to guard against
// accidental or CSRF-triggered destructive calls.
export const POST = async (req: NextRequest) => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  let confirm: unknown;
  try {
    const body = (await req.json()) as { confirm?: unknown };
    confirm = body?.confirm;
  } catch {
    confirm = undefined;
  }

  if (confirm !== "WIPE") {
    return NextResponse.json(
      { ok: false, error: 'Confirmation required: send {"confirm":"WIPE"}.' },
      { status: 400 }
    );
  }

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
