
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  // If the user is trying to access the dashboard and is not logged in,
  // redirect them to the sign-in page.
  if (pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }
  
  // If the user is logged in and tries to access the sign-in page,
  // redirect them to the dashboard.
  if (pathname.startsWith('/signin') && session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow the request to continue
  return NextResponse.next();
}

export const config = {
  // Matcher to run the middleware on specific paths
  matcher: ['/dashboard/:path*', '/signin'],
}
