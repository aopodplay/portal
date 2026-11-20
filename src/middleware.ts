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

function decodeTokenPayload(token: string | undefined): { role?: string; platformOnly?: boolean } | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

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
  const payload = decodeTokenPayload(token);
  const isPlatformOnly =
    Boolean(payload?.platformOnly) || String(payload?.role || '').toLowerCase() === 'support';

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
    return NextResponse.redirect(new URL(isPlatformOnly ? '/controle' : '/', request.url));
  }

  // Utilizadores apenas da plataforma (ex: equipa de suporte) só podem aceder ao painel /controle e /settings
  if (isAuthenticated && isPlatformOnly && !pathname.startsWith('/api')) {
    const allowedPlatformPaths = ['/controle', '/settings', '/forgot-password'];
    const isAllowed = allowedPlatformPaths.some(
      (p) => pathname === p || pathname.startsWith(p + '/')
    );
    if (!isAllowed) {
      return NextResponse.redirect(new URL('/controle', request.url));
    }
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
