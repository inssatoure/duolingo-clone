import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { isRateLimited } from "@/lib/otp-rate-limit";
import { E164_PHONE, e164ToUsername } from "@/lib/phone";
import { checkOtp } from "@/lib/twilio";

const PIN = /^\d{4}$/;

/**
 * Public (pre-login) PIN recovery. Clerk's native phone reset requires a paid
 * plan, so we prove phone ownership with our own Twilio Verify code and then
 * reset the Clerk password (the PIN) via the backend SDK. The Twilio code is
 * checked here EXACTLY once (a Verify code is single-use), so the client must
 * NOT pre-verify it. Responses are generic - we never reveal whether an
 * account exists for a given number.
 */
export const POST = async (req: Request) => {
  const { phoneNumber, code, newPin } = (await req
    .json()
    .catch(() => ({}))) as {
    phoneNumber?: string;
    code?: string;
    newPin?: string;
  };

  if (!phoneNumber || !E164_PHONE.test(phoneNumber) || !code || !newPin || !PIN.test(newPin)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (isRateLimited(`reset:${phoneNumber}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const valid = await checkOtp(phoneNumber, code);
  if (!valid) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }

  try {
    const username = e164ToUsername(phoneNumber);
    const client = await clerkClient();
    const { data } = await client.users.getUserList({ username: [username] });
    const user = data[0];

    // Generic success even when no account matches, so we don't leak existence.
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    await client.users.updateUser(user.id, {
      password: newPin,
      skipPasswordChecks: true, // 4-digit PIN by design
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("reset-pin failed:", error);
    return NextResponse.json({ error: "reset_failed" }, { status: 502 });
  }
};
