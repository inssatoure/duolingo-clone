// In-memory best-effort throttle: keeps a phone number from triggering
// unlimited paid SMS/WhatsApp sends. Not durable across serverless
// instances/regions - Twilio Verify's own per-number fraud guard is the
// real backstop, this just adds a cheap first layer.
const hits = new Map<string, number[]>();

export const isRateLimited = (key: string, max: number, windowMs: number) => {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
};
