import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";

import { sendWelcomeEmail } from "@/lib/resend";

type ClerkUserCreatedEvent = {
  type: string;
  data: {
    first_name: string | null;
    email_addresses: { id: string; email_address: string }[];
    primary_email_address_id: string | null;
  };
};

/** Clerk webhook: on user.created, send the welcome email.
 * Configure in the Clerk dashboard (Webhooks -> Add endpoint):
 *   URL: https://<your-domain>/api/webhooks/clerk
 *   Event: user.created
 * Then set CLERK_WEBHOOK_SECRET (the "Signing Secret" Clerk shows you) and
 * RESEND_API_KEY as Vercel environment variables. */
export const POST = async (req: NextRequest) => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret)
    return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET is not configured." }, { status: 500 });

  const headerList = await headers();
  const svixId = headerList.get("svix-id");
  const svixTimestamp = headerList.get("svix-timestamp");
  const svixSignature = headerList.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature)
    return NextResponse.json({ error: "Missing svix headers." }, { status: 400 });

  const body = await req.text();

  let event: ClerkUserCreatedEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserCreatedEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  if (event.type !== "user.created") return NextResponse.json({ ok: true, skipped: true });

  const primaryEmail = event.data.email_addresses.find(
    (e) => e.id === event.data.primary_email_address_id
  )?.email_address;
  if (!primaryEmail) return NextResponse.json({ ok: true, skipped: "no email" });

  try {
    await sendWelcomeEmail(primaryEmail, event.data.first_name);
  } catch (error) {
    console.error("Welcome email failed:", error);
    // Don't fail the webhook - Clerk retries on non-2xx, and a missing/bad
    // email config shouldn't block user creation flows.
    return NextResponse.json({
      ok: true,
      emailError: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return NextResponse.json({ ok: true });
};
