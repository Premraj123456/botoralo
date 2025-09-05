import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is a placeholder middleware to disable the faulty Clerk integration.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
