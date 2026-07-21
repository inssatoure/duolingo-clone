import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that must remain publicly reachable without auth.
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/api/recordings/play",
  "/api/recordings/keys",
  "/api/auth/(.*)",
  "/api/webhooks/(.*)",
  "/api/tts/manifest",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  // Everything else — including /admin(.*) and the admin API routes — must
  // be authenticated. Admin authorization itself is enforced separately by
  // getIsAdmin() in each admin route handler / page (fail-closed).
  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
