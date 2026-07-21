import { NextResponse } from "next/server";

import { isRateLimited } from "@/lib/otp-rate-limit";
import { E164_PHONE } from "@/lib/phone";
import { checkOtp } from "@/lib/twilio";
import { signVerifiedPhone } from "@/lib/verify-token";

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
  if (!valid) return NextResponse.json({ valid: false });

  // The Twilio code is now consumed; issue our own short-lived proof so the
  // account-creation step (a separate request) doesn't need to re-check it.
  return NextResponse.json({ valid: true, verifiedToken: signVerifiedPhone(phoneNumber) });
};
