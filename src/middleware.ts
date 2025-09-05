import { NextResponse, type NextRequest } from 'next/server';
import { getLoggedInUser } from '@/lib/appwrite/auth.server';

export async function middleware(request: NextRequest) {
  const user = await getLoggedInUser();
  const { pathname } = request.nextUrl;

  const authRoutes = ['/sign-in', '/sign-up'];

  if (user && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
