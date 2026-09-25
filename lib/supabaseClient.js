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

// Armazenamento da sessão: sessionStorage em vez do padrão (localStorage), de propósito - a
// sessão dura só enquanto o navegador fica aberto; fechou, precisa logar de novo.
//
// A exceção é o "code verifier" do PKCE, que fica no localStorage. Motivo: sessionStorage é
// POR ABA, e o login da Microsoft nem sempre volta na mesma aba que começou (link aberto pelo
// Outlook/Teams, navegador configurado para abrir em nova aba, etc.). Quando isso acontece, o
// verifier não existe na aba que recebeu o retorno, a troca do código pela sessão falha e a
// pessoa volta para a tela de login SEM mensagem nenhuma - parece que "não fez nada". O
// verifier é temporário e o próprio Supabase o apaga assim que a sessão é criada, então
// mantê-lo no localStorage não estende a duração da sessão.
function storageFor(key) {
  return String(key).includes('code-verifier') ? window.localStorage : window.sessionStorage;
}

const authStorage = {
  getItem: (key) => storageFor(key).getItem(key),
  setItem: (key, value) => storageFor(key).setItem(key, value),
  removeItem: (key) => storageFor(key).removeItem(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? authStorage : undefined,
  },
});
