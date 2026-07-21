import { NextResponse } from "next/server";

import { SENEGAL_PHONE } from "@/lib/phone";
import { isRateLimited } from "@/lib/otp-rate-limit";
import { sendOtp } from "@/lib/twilio";

export const POST = async (req: Request) => {
  const { phoneNumber } = (await req.json().catch(() => ({}))) as {
    phoneNumber?: string;
  };

  if (!phoneNumber || !SENEGAL_PHONE.test(phoneNumber)) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  if (isRateLimited(`send:${phoneNumber}`, 3, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  try {
    await sendOtp(phoneNumber);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("send-otp failed:", error);
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }
};
