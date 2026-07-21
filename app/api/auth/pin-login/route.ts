import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db/drizzle";
import { userPins } from "@/db/schema";
import { isRateLimited } from "@/lib/otp-rate-limit";
import { E164_PHONE, e164ToUsername } from "@/lib/phone";
import { verifyPin } from "@/lib/pin";

const PIN = /^\d{4}$/;

/**
 * Everyday sign-in: phone + PIN, no OTP. Clerk never checked a password here
 * (accounts are created with skipPasswordRequirement), so this route IS the
 * brute-force gate for the PIN - keep the rate limit tight.
 */
export const POST = async (req: Request) => {
  const { phoneNumber, pin } = (await req.json().catch(() => ({}))) as {
    phoneNumber?: string;
    pin?: string;
  };

  if (!phoneNumber || !E164_PHONE.test(phoneNumber) || !pin || !PIN.test(pin)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (isRateLimited(`pin-login:${phoneNumber}`, 8, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const username = e164ToUsername(phoneNumber);

  try {
    const client = await clerkClient();
    const { data } = await client.users.getUserList({ username: [username] });
    const user = data[0];

    // Generic failure whether the account doesn't exist or the PIN is
    // wrong, so we never reveal which one it was.
    const genericFailure = () =>
      NextResponse.json({ error: "invalid_credentials" }, { status: 401 });

    if (!user) return genericFailure();

    const [row] = await db
      .select({ pinHash: userPins.pinHash })
      .from(userPins)
      .where(eq(userPins.userId, user.id))
      .limit(1);

    if (!row || !(await verifyPin(pin, row.pinHash))) return genericFailure();

    const signInToken = await client.signInTokens.createSignInToken({
      userId: user.id,
      expiresInSeconds: 60,
    });

    return NextResponse.json({ ticket: signInToken.token });
  } catch (error) {
    console.error("pin-login failed:", error);
    return NextResponse.json({ error: "login_failed" }, { status: 502 });
  }
};
