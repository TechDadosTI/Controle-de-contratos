-- Prioridade 5 da revisão de segurança (2026-09-17): a importação de planilha fazia um DELETE
-- de todos os contratos da empresa e, DEPOIS, em uma chamada separada, um INSERT dos novos - se
-- o INSERT falhasse (conexão caiu, arquivo com dado inválido, limite excedido etc.), os
-- contratos antigos já tinham sido apagados e eram perdidos de vez.
--
-- Esta migration cria uma função no banco que faz "apagar + inserir" dentro de UMA única
-- transação: se qualquer parte falhar, o Postgres desfaz tudo (inclusive o delete) e os
-- contratos antigos continuam exatamente como estavam.
--
-- PRÉ-REQUISITO: rode 0001_rls_hardening.sql primeiro (esta função depende de public.is_editor()
-- e das policies de contracts criadas lá).
--
-- IMPORTANTE: depois de rodar isto no Supabase, é necessário também atualizar o código do app
-- (já preparado nesta branch) para chamar supabase.rpc('import_contracts', ...) em vez de fazer
-- delete()+insert() separados - senão a importação para de funcionar. Não faça merge/deploy
-- deste código sem antes ter rodado esta migration no projeto Supabase de produção.

begin;

create or replace function public.import_contracts(p_company text, p_rows jsonb)
returns setof public.contracts
language plpgsql
as $$
declare
  v_count int;
begin
  if p_company is null or p_company not in ('agrobiotech', 'pilar', 'tarponFranca', 'tarponAraxa') then
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

revoke all on function public.import_contracts(text, jsonb) from public;
grant execute on function public.import_contracts(text, jsonb) to authenticated;

commit;

-- ==================== ROLLBACK (só se precisar reverter) ====================
-- Reverte para o comportamento antigo (delete + insert separados no cliente) removendo a
-- função - só faça isso depois de reverter também o código do app que a chama.
-- begin;
-- drop function if exists public.import_contracts(text, jsonb);
-- commit;
