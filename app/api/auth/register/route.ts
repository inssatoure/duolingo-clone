import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import db from "@/db/drizzle";
import { userPins } from "@/db/schema";
import { isRateLimited } from "@/lib/otp-rate-limit";
import { E164_PHONE, e164ToUsername } from "@/lib/phone";
import { hashPin } from "@/lib/pin";
import { checkVerifiedPhone } from "@/lib/verify-token";

const PIN = /^\d{4}$/;

// This Clerk instance currently requires a phone_number AND (email_address
// or oauth) to create a user, but rejects Senegal numbers outright
// ("unsupported_country_code"). Until that's turned off in the Clerk
// Dashboard (User & Authentication -> Email, Phone, Username: make Phone
// optional, Username required), satisfy both fields with values that can
// never belong to a real person and that Clerk never actually contacts:
// - phone: a NANP number, area code + local number derived from a hash of
//   the real number, exchange code 555 (industry-reserved for fiction/
//   non-working numbers in the US - see NANPA guidelines).
// - email: our own domain's namespace, so if anything were ever sent there
//   it would just be undeliverable, never reach a stranger's inbox.
const placeholderPhone = (username: string): string => {
  let hash = 0;
  for (const ch of username) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const areaCode = 200 + (hash % 800); // valid NANP area codes: 200-999
  const suffix = String((hash >> 8) % 100).padStart(2, "0"); // 00-99
  return `+1${areaCode}55501${suffix}`; // 555-01XX: NANPA-reserved fiction block
};
const placeholderEmail = (username: string) => `${username}@wolingo.vercel.app`;

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
      phoneNumber: [placeholderPhone(username)],
      emailAddress: [placeholderEmail(username)],
      skipPasswordRequirement: true,
      skipLegalChecks: true,
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
