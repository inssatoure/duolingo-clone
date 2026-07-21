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
  get(_target, prop) {
    const client = getTwilio();
    const value = Reflect.get(client, prop);
    // Never forward the Proxy itself as `this` (via a `receiver` arg) to the
    // real client's methods/getters - the Twilio SDK relies on private class
    // fields only reachable through the real instance. Binding functions to
    // `client` here keeps `this` correct even for calls resolved later.
    return typeof value === "function" ? value.bind(client) : value;
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

// WhatsApp authentication-template pricing to Senegal is roughly 65x cheaper
// than SMS (~$0.008 vs ~$0.55 per message, Twilio's published rates), so it
// is the primary channel. It requires an approved WhatsApp Business sender
// attached to the Verify Service in the Twilio console - until that's done,
// `sendOtp` below automatically falls back to SMS so signups never break.
export const PRIMARY_OTP_CHANNEL = "whatsapp" as const;
export const FALLBACK_OTP_CHANNEL = "sms" as const;

// Sends an OTP, preferring WhatsApp and falling back to SMS on any failure
// (e.g. no WhatsApp sender configured yet, user not reachable on WhatsApp).
// Throws only if both channels fail.
export const sendOtp = async (phoneNumber: string): Promise<void> => {
  const service = twilioClient.verify.v2.services(getVerifyServiceSid());
  try {
    await service.verifications.create({ to: phoneNumber, channel: PRIMARY_OTP_CHANNEL });
  } catch (whatsappError) {
    console.error("sendOtp: WhatsApp failed, falling back to SMS:", whatsappError);
    await service.verifications.create({ to: phoneNumber, channel: FALLBACK_OTP_CHANNEL });
  }
};

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
