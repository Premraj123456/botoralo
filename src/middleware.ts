import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getLoggedInUser } from './lib/appwrite/actions';

const publicRoutes = [
    "/",
    "/pricing",
    "/terms",
    "/privacy",
    "/sign-in",
    "/sign-up",
];

const protectedRoutes = [
    "/dashboard",
    "/dashboard/bots",
    "/dashboard/billing",
    "/dashboard/settings",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    const user = await getLoggedInUser();

    if (user && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    if (!user && protectedRoutes.some(path => pathname.startsWith(path))) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }

  } catch (error) {
     console.log("Middleware error:", error);
     // If session check fails, redirect to sign-in for protected routes
     if (protectedRoutes.some(path => pathname.startsWith(path))) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
     }
  }

  return NextResponse.next();
}

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
