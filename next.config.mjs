// Mesmo valor padrão do projeto Supabase usado em lib/supabaseClient.js - precisa bater aqui
// também porque connect-src da CSP tem que liberar explicitamente o host que o navegador vai
// chamar (REST + Auth do Supabase rodam no mesmo host).
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kzugdbygvkqkvrqldvws.supabase.co';

// App 100% estático/client-side, sem nonce (nonce exigiria renderização dinâmica em todas as
// páginas - ver node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
// 'unsafe-inline' em script-src é necessário pelos scripts inline que o próprio Next.js injeta
// para hidratar a página (RSC payload); 'unsafe-inline' em style-src é necessário pelos atributos
// style="..." usados para theming por empresa (não existe alternativa via nonce para atributos
// inline). O app não usa dangerouslySetInnerHTML nem eval, então o risco residual é baixo.
const isDev = process.env.NODE_ENV === 'development';
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self' ${SUPABASE_URL};
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, ' ')
  .trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          // X-Frame-Options fica como reforço para navegadores mais antigos que não entendem
          // frame-ancestors da CSP.
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
