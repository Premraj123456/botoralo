import { NextResponse, type NextRequest } from 'next/server';
import { getLoggedInUser } from '@/lib/appwrite/auth.server';

export async function middleware(request: NextRequest) {
  const user = await getLoggedInUser();
  const { pathname } = request.nextUrl;

  const authRoutes = ['/sign-in', '/sign-up'];

  // If the user is logged in and tries to access an auth route, redirect to dashboard
  if (user && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If the user is not logged in and tries to access a protected route, redirect to sign-in
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  // Match all routes except for API routes, static files, and images
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
