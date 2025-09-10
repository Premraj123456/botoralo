
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase credentials aren't provided or are invalid, bypass the middleware logic
  // to prevent the app from crashing.
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables not found. Skipping middleware authentication.");
    return response;
  }

  // Validate the URL to prevent crashes from placeholder values
  try {
    new URL(supabaseUrl);
  } catch (error) {
    console.warn(`Invalid Supabase URL: ${supabaseUrl}. Skipping middleware authentication.`);
    return response;
  }


  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // If user is logged in and tries to access signin page, redirect to dashboard
  if (session && pathname === '/signin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user is not logged in and tries to access a protected route, redirect to signin
  if (!session && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  return response;
}

export const config = {
  // Only run the middleware on the dashboard and auth routes
  matcher: ['/dashboard/:path*', '/signin'],
};
