import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge } from '@/lib/auth/verifyTokenEdge';

const COOKIE_NAME = 'session';

/**
 * Route → allowed roles mapping.
 * Order matters: more specific routes should come first.
 */
const ROUTE_RULES: { pattern: RegExp; roles: string[] | 'superadmin' }[] = [
  // Superadmin panel — email-based check
  { pattern: /^\/super-admin(\/|$)/, roles: 'superadmin' },
  // Admin routes
  { pattern: /^\/admin(\/|$)/, roles: ['admin'] },
  // Grader
  { pattern: /^\/grader(\/|$)/, roles: ['admin', 'calificador'] },
  // Register
  { pattern: /^\/register(\/|$)/, roles: ['admin', 'registrador'] },
];

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const loginUrl = new URL('/auth/login', request.url);

  // Find matching rule
  const rule = ROUTE_RULES.find((r) => r.pattern.test(pathname));
  if (!rule) {
    return NextResponse.next();
  }

  // Read session cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  // Verify JWT
  const decoded = await verifyTokenEdge(token);
  if (!decoded) {
    return NextResponse.redirect(loginUrl);
  }

  // Superadmin check: must be admin + match env email
  if (rule.roles === 'superadmin') {
    const superadminEmail = process.env.ADMIN_EMAIL;
    if (decoded.role !== 'admin' || decoded.email !== superadminEmail) {
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Role check
  if (!rule.roles.includes(decoded.role)) {
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/grader/:path*',
    '/register/:path*',
    '/super-admin/:path*',
  ],
};
