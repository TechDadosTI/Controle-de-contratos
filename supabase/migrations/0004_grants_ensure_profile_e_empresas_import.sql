-- Revisão de segurança de 2026-09-21 (depois da troca do login para conta Microsoft/Entra ID).
-- Dois ajustes no banco, nenhuma mudança no código do app:
--
--   1) public.ensure_profile() está hoje chamável SEM login. Confirmado contra a API de
--      produção com apenas a chave pública: POST /rest/v1/rpc/ensure_profile devolveu
--      200/null, enquanto is_editor() e import_contracts() devolveram 401 corretamente.
--      Hoje ela não vaza nada (sem sessão, auth.uid() é nulo e o retorno é nulo), mas é
--      superfície desnecessária - e mais ainda se ela for "security definer", já que precisa
--      escrever em profiles. Aqui ela passa a exigir login, igual às outras duas.
--
--   2) public.import_contracts() só aceita as 4 empresas originais. Desde a inclusão de BGC,
--      AgroBGC, Cempra, Golden Drops, Biosulfa, Agrobics e Hidrossolúvel (commit b3e9208), a
--      importação de planilha nessas 7 falha com "Empresa inválida". Não é problema de
--      segurança, é quebra de função. A lista passa a ser as 11 empresas de COMPANY_ORDER em
--      lib/companies.js - se entrar empresa nova lá, tem que entrar aqui também.
--
-- COMO RODAR: cole este arquivo inteiro no SQL Editor do Supabase (projeto do Controle de
-- Contratos) e execute. Pode rodar mais de uma vez (idempotente).
--
-- NÃO exige deploy nem alteração do app: o app continua chamando rpc('ensure_profile') já
-- logado e rpc('import_contracts', {p_company, p_rows}) com a mesma assinatura.
--
-- PRÉ-REQUISITOS: 0001_rls_hardening.sql, 0002_atomic_import.sql e o 0003 (tabela
-- allowed_users + ensure_profile() + policy de leitura exigindo perfil existente) já rodados.
-- Obs.: o 0003 não está neste repositório - foi executado direto no Supabase e o arquivo se
-- perdeu. Quando aparecer, deve entrar aqui como 0003_*.sql para o histórico ficar completo.
--
-- Rollback no fim deste arquivo (comentado).

begin;

-- ---------- 1) ensure_profile(): só para quem está autenticado ----------
-- Feito com um laço sobre pg_proc em vez de "revoke ... on function public.ensure_profile()"
-- porque a assinatura exata da função não está neste repositório (ver observação sobre o 0003
-- acima). Assim vale para qualquer assinatura/sobrecarga que exista, e falha em voz alta se a
-- função não existir - em vez de não fazer nada silenciosamente e dar a impressão de que
-- fechou.
do $$
declare
  r record;
  v_encontradas int := 0;
begin
  for r in
    select oid::regprocedure as assinatura
      from pg_proc
     where pronamespace = 'public'::regnamespace
       and proname = 'ensure_profile'
  loop
    execute format('revoke all on function %s from public', r.assinatura);
    execute format('revoke all on function %s from anon', r.assinatura);
    execute format('grant execute on function %s to authenticated', r.assinatura);
    v_encontradas := v_encontradas + 1;
    raise notice 'ensure_profile protegida: %', r.assinatura;
  end loop;

  if v_encontradas = 0 then
    raise exception 'public.ensure_profile() não existe neste banco - rode o 0003 antes deste arquivo.';
  end if;
end $$;

-- ---------- 2) import_contracts(): as 11 empresas ----------
-- Corpo idêntico ao de 0002_atomic_import.sql; muda SÓ a lista de empresas aceitas.
-- Continua sem "security definer" de propósito: roda com os privilégios de quem chamou, então
-- as policies de contracts continuam valendo dentro dela.
create or replace function public.import_contracts(p_company text, p_rows jsonb)
returns setof public.contracts
language plpgsql
as $$
declare
  v_count int;
begin
  if p_company is null or p_company <> all (array[
    'agrobiotech', 'pilar', 'tarponFranca', 'tarponAraxa', 'bgc', 'agroBgc', 'cempra',
    'goldenDrops', 'biosulfa', 'agrobics', 'hidrossoluvel'
  ]) then
    raise exception 'Empresa inválida: %', p_company;
  end if;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Lista de contratos inválida.';
  end if;

  v_count := jsonb_array_length(p_rows);
  if v_count = 0 then
    raise exception 'Nenhum contrato para importar.';
  end if;
  -- Limite de tamanho: hoje a maior empresa tem menos de 100 contratos: 2000 dá bastante
  -- margem para crescimento sem permitir um arquivo absurdamente grande travar o banco.
  if v_count > 2000 then
    raise exception 'Excedeu o limite de 2000 contratos por importação (recebido: %).', v_count;
  end if;

  -- A policy de insert/delete já bloqueia quem não é 'editor', mas checar aqui primeiro devolve
  -- uma mensagem de erro clara em vez de uma falha genérica de RLS no meio da operação.
  if not public.is_editor() then
    raise exception 'Sem permissão para importar contratos.';
  end if;

  delete from public.contracts where company = p_company;

  return query
    insert into public.contracts (
      company, empresa_contratante, empresa_contratada, centro_custo, responsavel, objeto,
      objeto_detalhe, valor, pagamento, data_inicio, data_termino, prazo_vigencia, prazo_aviso,
      status, assinado, origem
    )
    select
      p_company, r.empresa_contratante, r.empresa_contratada, r.centro_custo, r.responsavel,
      r.objeto, r.objeto_detalhe, r.valor, r.pagamento, r.data_inicio, r.data_termino,
      r.prazo_vigencia, r.prazo_aviso, r.status, r.assinado, r.origem
    from jsonb_to_recordset(p_rows) as r(
      empresa_contratante text, empresa_contratada text, centro_custo text, responsavel text,
      objeto text, objeto_detalhe text, valor text, pagamento text, data_inicio text,
      data_termino text, prazo_vigencia text, prazo_aviso text, status text, assinado text,
      origem text
    )
    returning *;
end;
$$;

-- "create or replace" preserva os grants existentes, mas repetimos por garantia (idempotente).
revoke all on function public.import_contracts(text, jsonb) from public;
revoke all on function public.import_contracts(text, jsonb) from anon;
grant execute on function public.import_contracts(text, jsonb) to authenticated;

commit;

-- ==================== COMO CONFERIR DEPOIS DE RODAR ====================
-- Quem pode executar cada função (esperado: só "authenticated", fora do service_role).
-- Se "anon" aparecer para alguma delas, o grant ainda está aberto - inclusive quando o grant
-- foi feito para PUBLIC, porque PUBLIC não é uma linha de pg_roles e se manifesta via anon:
--
--   select p.oid::regprocedure as funcao, r.rolname as pode_executar
--     from pg_proc p
--     join pg_roles r on has_function_privilege(r.rolname, p.oid, 'execute')
--    where p.pronamespace = 'public'::regnamespace
--      and p.proname in ('ensure_profile', 'is_editor', 'import_contracts')
--      and r.rolname in ('anon', 'authenticated')
--    order by 1, 2;
--
-- Pela API, com a chave pública e sem sessão, o esperado passa a ser 401 nas três:
--
--   curl -s -X POST "https://<projeto>.supabase.co/rest/v1/rpc/ensure_profile" \
--     -H "apikey: <chave publica>" -H "Authorization: Bearer <chave publica>" \
--     -H "Content-Type: application/json" -d '{}'
--
-- ==================== ROLLBACK (só se precisar reverter) ====================
-- Reabrir ensure_profile para quem não está logado (NÃO recomendado - era o estado anterior):
--   grant execute on function public.ensure_profile() to anon;
--
-- Voltar import_contracts para as 4 empresas originais: rode de novo o arquivo
-- 0002_atomic_import.sql inteiro (ele é "create or replace" e é idempotente).
