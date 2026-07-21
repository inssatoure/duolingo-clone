import { NextResponse } from "next/server";

import { isRateLimited } from "@/lib/otp-rate-limit";
import { E164_PHONE } from "@/lib/phone";
import { checkOtp } from "@/lib/twilio";

export const POST = async (req: Request) => {
  const { phoneNumber, code } = (await req.json().catch(() => ({}))) as {
    phoneNumber?: string;
    code?: string;
  };

  if (!phoneNumber || !E164_PHONE.test(phoneNumber) || !code) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (isRateLimited(`verify:${phoneNumber}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const valid = await checkOtp(phoneNumber, code);
  return NextResponse.json({ valid });
};
