import { stack } from '@/stack';

export const middleware = stack.middleware({
  // The default is to redirect to `/sign-in`,
  // but you can also provide a function to do something else.
  unauthenticated: (req) => {
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      const url = new URL(req.url);
      url.pathname = '/sign-in';
      return Response.redirect(url);
    }
  },
  // The default is to redirect to `/`,
  // but you can also provide a function to do something else.
  authenticated: (req) => {
    if (req.nextUrl.pathname === '/sign-in' || req.nextUrl.pathname === '/sign-up') {
      const url = new URL(req.url);
      url.pathname = '/dashboard';
      return Response.redirect(url);
    }
  }
});

export const config = {
  // Match all routes except for API routes, static files, and images
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
