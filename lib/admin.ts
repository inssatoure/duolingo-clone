import { auth, currentUser } from "@clerk/nextjs/server";

const DEFAULT_ADMIN_EMAILS = ["apsfdsn@gmail.com"];

export const getIsAdmin = async () => {
  const { userId } = await auth();

  if (!userId) return false;

  const adminIds =
    process.env.CLERK_ADMIN_IDS?.split(",")
      .map((id) => id.trim())
      .filter(Boolean) ?? [];

  if (adminIds.includes(userId)) return true;

  // Admins can also be granted by email (CLERK_ADMIN_EMAILS, comma-separated).
  const adminEmails = [
    ...DEFAULT_ADMIN_EMAILS,
    ...(process.env.CLERK_ADMIN_EMAILS?.split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean) ?? []),
  ];

  const user = await currentUser();
  const emails =
    user?.emailAddresses.map((e) => e.emailAddress.toLowerCase()) ?? [];

  return emails.some((e) => adminEmails.includes(e));
};
