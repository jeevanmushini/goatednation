import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Helper to attach standard security headers (PROD-01)
  const attachSecurityHeaders = (res: NextResponse) => {
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'SAMEORIGIN');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    );
    return res;
  };

  // 1. Admin route protection at the edge
  if (pathname.startsWith('/admin')) {
    const token =
      request.cookies.get('auth_token')?.value ||
      request.cookies.get('gn_auth_token')?.value;

    if (!token && process.env.NODE_ENV === 'production') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return attachSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  // 2. CORS and Security Headers for API routes
  if (pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.SITE_URL,
      'http://localhost:3000',
    ].filter(Boolean) as string[];

    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production')) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      }
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, x-razorpay-signature, x-shiprocket-hmac'
      );
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      return attachSecurityHeaders(response);
    }

    const response = NextResponse.next();
    if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production')) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    return attachSecurityHeaders(response);
  }

  return attachSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
