import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware({
  // Add public routes here
  publicRoutes: [
    '/',
    '/pricing',
    '/terms',
    '/privacy',
    '/sign-in',
    '/sign-up',
  ],
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
