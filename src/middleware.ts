// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas públicas (acessíveis sem login)
const publicRoutes = ['/login', '/register', '/forgot-password', '/verify-account'];

// Rotas de API públicas (essenciais para o funcionamento)
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
  
  // Verificar se é uma rota de API pública - PERMITIR SEMPRE
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route));
  if (isPublicApiRoute) {
    return NextResponse.next();
  }
  
  // Verificar se é arquivo estático
  const isStaticFile = pathname.includes('_next') || 
                       pathname.includes('favicon.ico') || 
                       pathname.includes('logo') ||
                       pathname.includes('images');
  if (isStaticFile) {
    return NextResponse.next();
  }
  
  // Obter token dos cookies
  const token = request.cookies.get('podplay_token')?.value;
  const isAuthenticated = !!token;
  
  // Verificar se é uma rota pública de página
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  
  // Se não está autenticado e tenta acessar rota protegida, redirecionar para login
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // Se está autenticado e tenta acessar página de login/register, redirecionar para home
  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Adicionar headers para evitar cache
  const response = NextResponse.next();
  if (!isPublicRoute && isAuthenticated) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};