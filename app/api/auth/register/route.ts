import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import db from "@/db/drizzle";
import { userPins } from "@/db/schema";
import { isRateLimited } from "@/lib/otp-rate-limit";
import { E164_PHONE, e164ToUsername } from "@/lib/phone";
import { hashPin } from "@/lib/pin";
import { checkVerifiedPhone } from "@/lib/verify-token";

const PIN = /^\d{4}$/;

/**
 * Creates the account after phone verification, entirely bypassing Clerk's
 * password system (its minimum length can't go as low as a 4-digit PIN).
 * The Clerk user is created with no password at all (skipPasswordRequirement),
 * our own PIN hash is stored separately, and a one-time sign-in token
 * ("ticket") is returned so the client can complete the session via
 * signIn.create({ strategy: "ticket", ticket }) - no Clerk password field
 * is ever touched.
 */
export const POST = async (req: Request) => {
  const { phoneNumber, verifiedToken, name, pin } = (await req
    .json()
    .catch(() => ({}))) as {
    phoneNumber?: string;
    verifiedToken?: string;
    name?: string;
    pin?: string;
  };

  if (
    !phoneNumber ||
    !E164_PHONE.test(phoneNumber) ||
    !verifiedToken ||
    !name?.trim() ||
    !pin ||
    !PIN.test(pin)
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (isRateLimited(`register:${phoneNumber}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  if (!checkVerifiedPhone(verifiedToken, phoneNumber)) {
    return NextResponse.json({ error: "not_verified" }, { status: 400 });
  }

  const username = e164ToUsername(phoneNumber);

  try {
    const client = await clerkClient();
    const user = await client.users.createUser({
      username,
      firstName: name.trim(),
      skipPasswordRequirement: true,
      unsafeMetadata: { phoneNumber, phoneVerified: true },
    });

    const pinHash = await hashPin(pin);
    await db.insert(userPins).values({ userId: user.id, pinHash });

    const signInToken = await client.signInTokens.createSignInToken({
      userId: user.id,
      expiresInSeconds: 60,
    });

    return NextResponse.json({ ticket: signInToken.token });
  } catch (error) {
    console.error("register failed:", error);
    return NextResponse.json({ error: "register_failed" }, { status: 502 });
  }
};
