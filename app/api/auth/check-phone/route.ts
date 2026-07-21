import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { isRateLimited } from "@/lib/otp-rate-limit";
import { E164_PHONE, e164ToUsername } from "@/lib/phone";

/**
 * Lets the single unified auth page decide, right after the phone number is
 * entered, whether to show the sign-up branch (PIN x2 + name) or the sign-in
 * branch (PIN once + "forgot PIN?"). This does reveal whether a phone number
 * has an account (a standard, small trade-off for this kind of "one field,
 * one page" UX) — it does not reveal anything else about the account.
 */
export const POST = async (req: Request) => {
  const { phoneNumber } = (await req.json().catch(() => ({}))) as {
    phoneNumber?: string;
  };

  if (!phoneNumber || !E164_PHONE.test(phoneNumber)) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  if (isRateLimited(`check-phone:${phoneNumber}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  try {
    const client = await clerkClient();
    const { data } = await client.users.getUserList({
      username: [e164ToUsername(phoneNumber)],
    });
    return NextResponse.json({ exists: data.length > 0 });
  } catch (error) {
    console.error("check-phone failed:", error);
    return NextResponse.json({ error: "check_failed" }, { status: 502 });
  }
};
