// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas de autenticação (se já autenticado, redireciona para /)
const authRoutes = ['/login', '/register', '/forgot-password', '/verify-account'];

// Rotas que exigem sessão iniciada
const protectedRoutes = [
  '/library',
  '/history',
  '/profile',
  '/settings',
  '/studio',
  '/controle',
  '/favorites',
];

// Rotas de API públicas
const publicApiRoutes = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/resend-verification',
  '/api/v1/auth/verify',
  '/api/v1/users/check-email',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const isStaticFile =
    pathname.includes('_next') ||
    pathname.includes('favicon.ico') ||
    pathname.includes('logo') ||
    pathname.includes('images');
  if (isStaticFile) {
    return NextResponse.next();
  }

  const token = request.cookies.get('podplay_token')?.value;
  const isAuthenticated = !!token;

  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(route)
  );
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  // Só redireciona para /login em rotas privadas; navegação geral (/, /music, /videos, etc.) é aberta
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const response = NextResponse.next();
  if (!isAuthRoute && isAuthenticated) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
