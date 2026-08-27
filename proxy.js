import { NextResponse } from 'next/server';

// Bloqueio temporário de acesso enquanto o login definitivo (contas individuais via
// Supabase Auth) não está pronto. Sem SITE_LOCK_PASSWORD configurada na Vercel, o site
// fica indisponível para todo mundo (falha segura). Depois de configurar as env vars
// SITE_LOCK_USER / SITE_LOCK_PASSWORD no projeto da Vercel, o acesso libera via um
// usuário/senha único (autenticação HTTP Basic) até o login definitivo entrar no ar.
export function proxy(request) {
  const password = process.env.SITE_LOCK_PASSWORD;

  if (!password) {
    return new NextResponse('Sistema temporariamente indisponível.', { status: 503 });
  }

  const user = process.env.SITE_LOCK_USER || 'agrobiotech';
  const auth = request.headers.get('authorization');

  if (auth && auth.startsWith('Basic ')) {
    const decoded = atob(auth.slice(6));
    const sep = decoded.indexOf(':');
    const providedUser = decoded.slice(0, sep);
    const providedPass = decoded.slice(sep + 1);
    if (providedUser === user && providedPass === password) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Autenticação necessária.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Controle de Contratos"' },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
