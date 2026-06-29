import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const sessionId = req.cookies.get('session_id')?.value;
  const { pathname } = req.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') && !sessionId) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  // Redirect authenticated users from auth pages
  if ((pathname.startsWith('/auth/') || pathname === '/') && sessionId && pathname !== '/') {
    // Only redirect from auth pages, not landing
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
