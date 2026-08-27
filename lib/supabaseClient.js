import { createClient } from '@supabase/supabase-js';

// Projeto Supabase deste sistema (Agrobiotech, Pilar, Tarpon Franca, Tarpon Araxá).
// A chave é a "publishable key" (equivalente à antiga "anon key") - segura para expor no
// navegador por design do Supabase. As duas variáveis vêm de env vars (NEXT_PUBLIC_* fica
// disponível no navegador) com o valor atual como fallback, para o app funcionar mesmo que
// as env vars não tenham sido configuradas ainda no ambiente de deploy.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kzugdbygvkqkvrqldvws.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_RkzkSyzkgMtpEL5OCNbJ6Q_rX7r-YQz';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // sessionStorage em vez do padrão (localStorage): a sessão dura só enquanto o navegador
    // fica aberto. Fechou o navegador, precisa fazer login de novo da próxima vez - mesmo que
    // o navegador tenha a senha salva pra preencher rápido.
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
  },
});
