import { NextResponse } from "next/server";

import { isRateLimited } from "@/lib/otp-rate-limit";
import { getVerifyServiceSid, twilioClient } from "@/lib/twilio";

const E164 = /^\+[1-9]\d{6,14}$/;

export const POST = async (req: Request) => {
  const { phoneNumber, code } = (await req.json().catch(() => ({}))) as {
    phoneNumber?: string;
    code?: string;
  };

  if (!phoneNumber || !E164.test(phoneNumber) || !code) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (isRateLimited(`verify:${phoneNumber}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  try {
    const check = await twilioClient.verify.v2
      .services(getVerifyServiceSid())
      .verificationChecks.create({ to: phoneNumber, code });

    return NextResponse.json({ valid: check.status === "approved" });
  } catch (error) {
    console.error("verify-otp failed:", error);
    return NextResponse.json({ valid: false }, { status: 200 });
  }
};
