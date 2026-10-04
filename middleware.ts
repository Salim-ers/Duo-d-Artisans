import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/cookie';

/**
 * Première barrière légère : sans cookie de session, retour à la connexion.
 * La vérification complète (signature, compte actif, version de session, rôle)
 * est refaite côté serveur sur chaque page, action et route de l'administration.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api/admin');
  const res =
    pathname === '/admin/login' || req.cookies.get(SESSION_COOKIE)?.value
      ? NextResponse.next()
      : isApi
        ? NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        : NextResponse.redirect(new URL('/admin/login', req.url));
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
