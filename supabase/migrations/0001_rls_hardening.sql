-- Prioridade 2 da revisão de segurança (2026-09-17): fecha a leitura anônima direta da tabela
-- "contracts" via API REST do Supabase (confirmado com uma chamada GET simples usando só a
-- chave pública: retornava contagem exata de todos os contratos, sem exigir login nenhum) e
-- garante que só quem tem role = 'editor' em "profiles" consegue inserir/alterar/excluir.
--
-- COMO RODAR: cole este arquivo inteiro no SQL Editor do Supabase (projeto do Controle de
-- Contratos) e execute. É seguro rodar mais de uma vez (idempotente - os "drop ... if exists"
-- e "create or replace" cobrem isso).
--
-- ANTES DE RODAR EM PRODUÇÃO: teste primeiro num projeto Supabase de homologação/cópia, se
-- tiver um, logando como um usuário 'editor' e um 'viewer' reais para confirmar que:
--   1) leitura sem login (sem token de sessão) deixa de retornar contratos;
--   2) um usuário 'viewer' consegue ver a lista mas NÃO consegue criar/editar/excluir;
--   3) um usuário 'editor' continua conseguindo tudo normalmente.
--
-- Rollback no fim deste arquivo (comentado).

begin;

alter table public.contracts enable row level security;
alter table public.profiles  enable row level security;

-- Remove policies pré-existentes com nomes comuns que poderiam estar liberando leitura anônima
-- (ex.: o template padrão "Enable read access for all users" que o Supabase sugere ao criar uma
-- tabela). Ajuste/adicione aqui os nomes exatos das policies atuais se o painel mostrar outros -
-- veja em Authentication > Policies (ou Database > Tables > contracts > RLS) antes de rodar.
drop policy if exists "Enable read access for all users" on public.contracts;
drop policy if exists "Public read" on public.contracts;
drop policy if exists "Enable read access for all users" on public.profiles;

drop policy if exists "contracts_select_authenticated" on public.contracts;
drop policy if exists "contracts_insert_editor" on public.contracts;
drop policy if exists "contracts_update_editor" on public.contracts;
drop policy if exists "contracts_delete_editor" on public.contracts;
drop policy if exists "profiles_select_own" on public.profiles;

-- Função auxiliar: o usuário autenticado atual é 'editor'?
-- De propósito SEM "security definer": ela roda com os privilégios de quem chamou, então a
-- consulta interna a "profiles" já respeita a policy "profiles_select_own" abaixo (cada usuário
-- só lê a própria linha) - não precisa (nem deve) burlar RLS para isso.
create or replace function public.is_editor()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'editor'
  );
$$;

revoke all on function public.is_editor() from public;
grant execute on function public.is_editor() to authenticated;

-- ---------- contracts ----------
-- Leitura: qualquer usuário AUTENTICADO (nunca "anon") - hoje o app deixa qualquer conta
-- logada ver as 4 empresas (troca pelo menu ☰), então não há hoje uma regra de "empresa do
-- usuário" para aplicar aqui. Se no futuro cada conta só puder ver a própria empresa, adicione
-- uma coluna profiles.company e troque o "using (true)" abaixo por uma comparação com ela.
create policy "contracts_select_authenticated"
  on public.contracts for select
  to authenticated
  using (true);

-- Escrita: só quem for 'editor'. "with check" também no update para impedir alterar um
-- registro e/ou mudar seu "company" para algo que o editor não devesse tocar (hoje isso não é
-- restringido por empresa - ver nota acima).
create policy "contracts_insert_editor"
  on public.contracts for insert
  to authenticated
  with check (public.is_editor());

create policy "contracts_update_editor"
  on public.contracts for update
  to authenticated
  using (public.is_editor())
  with check (public.is_editor());

create policy "contracts_delete_editor"
  on public.contracts for delete
  to authenticated
  using (public.is_editor());

-- ---------- profiles ----------
-- Cada usuário só enxerga a própria linha (é só o que o app precisa: saber o próprio role).
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- De propósito: NENHUMA policy de insert/update/delete para "authenticated" em profiles.
-- Isso bloqueia qualquer tentativa - inclusive de um editor - de mudar o próprio role ou o de
-- outra pessoa pela API. Só é possível mudar role hoje via SQL Editor/Table Editor do Supabase
-- (usando a service_role, que ignora RLS por padrão), o que é o comportamento desejado.

commit;

-- ==================== ROLLBACK (só se precisar reverter) ====================
-- begin;
-- drop policy if exists "contracts_select_authenticated" on public.contracts;
-- drop policy if exists "contracts_insert_editor" on public.contracts;
-- drop policy if exists "contracts_update_editor" on public.contracts;
-- drop policy if exists "contracts_delete_editor" on public.contracts;
-- drop policy if exists "profiles_select_own" on public.profiles;
-- drop function if exists public.is_editor();
-- -- CUIDADO: desabilitar RLS de novo reabre a leitura anônima que este migration corrige.
-- -- alter table public.contracts disable row level security;
-- -- alter table public.profiles disable row level security;
-- commit;
