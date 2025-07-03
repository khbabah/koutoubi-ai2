import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    console.log('[Middleware] Path:', path);
    console.log('[Middleware] Token:', token ? {
      email: token.email,
      role: token.role,
      access_token: token.access_token ? 'Present' : 'Missing'
    } : 'No token');

    // Admin routes protection
    if (path.startsWith('/admin')) {
      if (!token || (token.role !== 'admin' && token.role !== 'super_admin')) {
        console.log('[Middleware] Redirecting non-admin from admin area');
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Teacher routes protection
    if (path.startsWith('/teacher')) {
      if (!token || !['teacher', 'admin', 'super_admin'].includes(token.role as string)) {
        console.log('[Middleware] Redirecting non-teacher from teacher area');
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        console.log('[Middleware.authorized] Path:', path, 'Token exists:', !!token);
        
        // Allow debug pages
        if (path === '/debug-login' || path === '/debug-pdf-auth') {
          return true;
        }
        
        return !!token;
      },
    },
  }
);

// Protect these routes
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/teacher/:path*',
    '/profile/:path*',
    '/cours/:path*',
  ],
};