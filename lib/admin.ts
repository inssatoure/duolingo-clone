import { auth, currentUser } from "@clerk/nextjs/server";

export const getIsAdmin = async () => {
  const { userId } = await auth();

  if (!userId) return false;

  const adminIds =
    process.env.CLERK_ADMIN_IDS?.split(",")
      .map((id) => id.trim())
      .filter(Boolean) ?? [];

  if (adminIds.includes(userId)) return true;

  // Admins can also be granted by email (CLERK_ADMIN_EMAILS, comma-separated).
  // Env-only, fail closed: if neither CLERK_ADMIN_IDS nor CLERK_ADMIN_EMAILS
  // is configured, nobody is admin.
  const adminEmails =
    process.env.CLERK_ADMIN_EMAILS?.split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean) ?? [];

  if (adminEmails.length === 0) return false;

  const user = await currentUser();
  const emails =
    user?.emailAddresses.map((e) => e.emailAddress.toLowerCase()) ?? [];

  return emails.some((e) => adminEmails.includes(e));
};
