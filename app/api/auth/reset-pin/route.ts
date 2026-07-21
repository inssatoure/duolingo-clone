import { clerkClient } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db/drizzle";
import { userPins } from "@/db/schema";
import { isRateLimited } from "@/lib/otp-rate-limit";
import { E164_PHONE, e164ToUsername } from "@/lib/phone";
import { hashPin } from "@/lib/pin";
import { checkOtp } from "@/lib/twilio";

const PIN = /^\d{4}$/;

/**
 * Public (pre-login) PIN recovery. Clerk's native phone reset requires a paid
 * plan (and its password minimum is too high for a 4-digit PIN anyway), so
 * we prove phone ownership with our own Twilio Verify code and then update
 * our own PIN hash directly - Clerk's password field is never touched. The
 * Twilio code is checked here EXACTLY once (a Verify code is single-use), so
 * the client must NOT pre-verify it. Responses are generic - we never reveal
 * whether an account exists for a given number. On success we return a
 * one-time sign-in ticket so the client can log the user straight in.
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

    const pinHash = await hashPin(newPin);
    await db
      .insert(userPins)
      .values({ userId: user.id, pinHash })
      .onConflictDoUpdate({
        target: userPins.userId,
        set: { pinHash, updatedAt: sql`now()` },
      });

    const signInToken = await client.signInTokens.createSignInToken({
      userId: user.id,
      expiresInSeconds: 60,
    });

    return NextResponse.json({ ok: true, ticket: signInToken.token });
  } catch (error) {
    console.error("reset-pin failed:", error);
    return NextResponse.json({ error: "reset_failed" }, { status: 502 });
  }
};
