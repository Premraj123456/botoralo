import { stackMiddleware } from "@stackframe/stack/next-server";

export const middleware = stackMiddleware({
  // The default is to redirect to `/sign-in`,
  unauthenticated: "/sign-in",
  publicRoutes: [
    "/",
    "/pricing",
    "/terms",
    "/privacy",
  ],
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/'
  ],
};
