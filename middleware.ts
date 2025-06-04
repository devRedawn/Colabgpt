import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  
  // Check if the user is trying to access a protected route
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/chat') ||
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/debug');
  
  // If trying to access a protected route without a session, redirect to login
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // If trying to access auth pages with a session, redirect to chat
  const isAuthPage = 
    request.nextUrl.pathname.startsWith('/login') || 
    request.nextUrl.pathname.startsWith('/register');
  
  if (isAuthPage && session) {
    const chatUrl = new URL('/chat', request.url);
    return NextResponse.redirect(chatUrl);
  }
  
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    '/chat/:path*',
    '/admin/:path*',
    '/debug/:path*',
    '/login',
    '/register',
  ],
};