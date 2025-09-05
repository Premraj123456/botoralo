import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  // Add public routes that don't require authentication
  publicRoutes: [
    "/", 
    "/pricing", 
    "/terms", 
    "/privacy", 
    "/sign-in(.*)", 
    "/sign-up(.*)"
  ],
});

export const config = {
  // Protect all routes including api/trpc routes
  // The matcher ignores static files and _next internals
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};