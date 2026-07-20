import { Resend } from "resend";

// Lazily construct the Resend client - see db/drizzle.ts for the pattern and
// full rationale (avoids crashing builds/environments missing the key).
let cached: Resend | null = null;

const getResend = (): Resend => {
  if (!cached) {
    if (!process.env.RESEND_API_KEY)
      throw new Error("RESEND_API_KEY is not configured.");
    cached = new Resend(process.env.RESEND_API_KEY);
  }
  return cached;
};

const welcomeEmailHtml = (firstName: string | null) => `
<div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #fff7ed;">
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="font-size: 40px;">🐰</div>
    <h1 style="color: #D35400; margin: 8px 0 0;">WoLingo</h1>
  </div>
  <div style="background: #fff; border-radius: 16px; padding: 24px; border: 2px solid #eee;">
    <h2 style="color: #333; margin-top: 0;">Jërëjëf${firstName ? `, ${firstName}` : ""} ! 🎉</h2>
    <p style="color: #555; line-height: 1.6;">
      Bienvenue sur WoLingo, l'application pour apprendre le wolof depuis le français
      ou l'anglais — et pour les wolofophones d'apprendre le français ou l'anglais.
    </p>
    <p style="color: #555; line-height: 1.6;">
      Ndank-ndank mooy japp golo ci ñaay — doucement mais sûrement, on y arrive.
      Ta première leçon t'attend !
    </p>
    <a href="https://wolingo.vercel.app/learn"
       style="display: inline-block; margin-top: 12px; background: #58cc02; color: #fff; padding: 12px 24px; border-radius: 12px; font-weight: bold; text-decoration: none;">
      Commencer à apprendre
    </a>
  </div>
  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 16px;">
    WoLingo — créé par Issa Touré
  </p>
</div>
`;

/** Sends the welcome email to a newly-signed-up user. Requires
 * RESEND_API_KEY and a verified sender domain in Resend. */
export const sendWelcomeEmail = async (to: string, firstName: string | null) => {
  const from = process.env.RESEND_FROM_EMAIL || "WoLingo <onboarding@resend.dev>";
  await getResend().emails.send({
    from,
    to,
    subject: "Bienvenue sur WoLingo ! 🐰🇸🇳",
    html: welcomeEmailHtml(firstName),
  });
};
