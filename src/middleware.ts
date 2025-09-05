import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  // Ensure that creator-facing routes are protected
  publicRoutes: [
    "/",
    "/pricing",
    "/terms",
    "/privacy",
    "/sign-in(.*)",
    "/sign-up(.*)",
  ],
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
