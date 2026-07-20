import { NextResponse } from "next/server";

import { isRateLimited } from "@/lib/otp-rate-limit";
import { OTP_CHANNEL, getVerifyServiceSid, twilioClient } from "@/lib/twilio";

const E164 = /^\+[1-9]\d{6,14}$/;

export const POST = async (req: Request) => {
  const { phoneNumber } = (await req.json().catch(() => ({}))) as {
    phoneNumber?: string;
  };

  if (!phoneNumber || !E164.test(phoneNumber)) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  if (isRateLimited(`send:${phoneNumber}`, 3, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  try {
    await twilioClient.verify.v2
      .services(getVerifyServiceSid())
      .verifications.create({ to: phoneNumber, channel: OTP_CHANNEL });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("send-otp failed:", error);
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }
};
