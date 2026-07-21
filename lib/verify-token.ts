import { createHmac, timingSafeEqual } from "node:crypto";

// Short-lived proof that a phone number was just verified by Twilio,
// so the OTP step (which consumes the Twilio code) and the account
// creation step can be two separate requests without re-checking a
// code that's already been consumed. Signed with CLERK_SECRET_KEY
// (already required, already secret) rather than adding a new env var.
const TTL_MS = 5 * 60 * 1000;

const secret = (): string => {
  const s = process.env.CLERK_SECRET_KEY;
  if (!s) throw new Error("CLERK_SECRET_KEY is required to sign phone-verification tokens.");
  return s;
};

export const signVerifiedPhone = (phoneNumber: string): string => {
  const payload = JSON.stringify({ phoneNumber, exp: Date.now() + TTL_MS });
  const body = Buffer.from(payload).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
};

export const checkVerifiedPhone = (token: string, phoneNumber: string): boolean => {
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;

  const expectedSig = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const { phoneNumber: p, exp } = JSON.parse(Buffer.from(body, "base64url").toString()) as {
      phoneNumber?: string;
      exp?: number;
    };
    return p === phoneNumber && typeof exp === "number" && Date.now() < exp;
  } catch {
    return false;
  }
};
