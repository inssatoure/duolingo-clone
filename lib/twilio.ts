import Twilio from "twilio";

// Lazily construct the Twilio client on first real use instead of at module
// load, so builds don't crash for environments missing the Twilio env vars
// (e.g. a Preview deployment with only Production env vars) - see
// db/drizzle.ts / lib/stripe.ts for the same pattern and full rationale.
let cached: Twilio.Twilio | null = null;

const getTwilio = (): Twilio.Twilio => {
  if (!cached) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token)
      throw new Error(
        "TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN are not set for this environment. Configure them in Vercel (Project Settings -> Environment Variables)."
      );
    cached = Twilio(sid, token);
  }
  return cached;
};

export const twilioClient = new Proxy({} as Twilio.Twilio, {
  get(_target, prop, receiver) {
    return Reflect.get(getTwilio(), prop, receiver);
  },
});

export const getVerifyServiceSid = (): string => {
  const sid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!sid)
    throw new Error(
      "TWILIO_VERIFY_SERVICE_SID is not set for this environment. Configure it in Vercel (Project Settings -> Environment Variables)."
    );
  return sid;
};

// SMS works immediately with just a Verify Service. Switch to "whatsapp"
// once a WhatsApp Business sender is approved and attached to the Verify
// Service in the Twilio console - no other code changes needed.
export const OTP_CHANNEL: "sms" | "whatsapp" = "sms";

// Checks a code against Twilio Verify. A Verify code is single-use: a
// successful check consumes the verification, so call this exactly once per
// code (do not pre-verify then verify again). Returns false on any Twilio
// error rather than throwing, so callers surface a generic "wrong code".
export const checkOtp = async (
  phoneNumber: string,
  code: string
): Promise<boolean> => {
  try {
    const check = await twilioClient.verify.v2
      .services(getVerifyServiceSid())
      .verificationChecks.create({ to: phoneNumber, code });
    return check.status === "approved";
  } catch (error) {
    console.error("checkOtp failed:", error);
    return false;
  }
};
