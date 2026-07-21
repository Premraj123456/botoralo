import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.searchParams.has('_ptxn')) {
    return NextResponse.rewrite(new URL('/paddle-return', request.url));
  }
}

export const config = {
  matcher: ['/'],
};
