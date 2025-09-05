
import { stackMiddleware } from "@stackframe/stack/next-server/app";

export const middleware = stackMiddleware({
  // The default is to redirect to `/sign-in`,
  // but you can also provide a url to a different page.
  unauthenticatedUrl: "/sign-in",
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
  ],
};
