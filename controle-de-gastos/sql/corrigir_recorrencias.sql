
alter table public.recorrencias add column if not exists dia_base integer
  check (dia_base between 1 and 31);

create or replace function public.confirmar_recorrencia(p_id bigint, p_data text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  r public.recorrencias%rowtype;
  atual date;
  proxima date;
  fim date;
  base integer;
begin
  if auth.uid() is null then raise exception 'Usuário não autenticado'; end if;
  select * into r from public.recorrencias
    where id = p_id and user_id = auth.uid() for update;
  if not found then raise exception 'Recorrência não encontrada'; end if;
  if r.status <> 'ativa' then raise exception 'Recorrência não está ativa'; end if;
  if r.data_inicio <> p_data then return false; end if;
  atual := to_date(r.data_inicio, 'DD/MM/YYYY');
  if to_char(atual, 'DD/MM/YYYY') <> r.data_inicio then raise exception 'Data inválida'; end if;
  if nullif(r.data_fim, '') is not null then
    fim := to_date(r.data_fim, 'DD/MM/YYYY');
    if to_char(fim, 'DD/MM/YYYY') <> r.data_fim then raise exception 'Data final inválida'; end if;
    if atual > fim then raise exception 'Recorrência encerrada'; end if;
  end if;
  base := coalesce(r.dia_base, extract(day from atual)::integer);
  if r.frequencia = 'semanal' then
    proxima := atual + 7;
  else
    proxima := (date_trunc('month', atual) + case when r.frequencia = 'anual' then interval '1 year' else interval '1 month' end)::date;
    proxima := proxima + (least(base, extract(day from (proxima + interval '1 month - 1 day'))::integer) - 1);
  end if;
  insert into public.gastos(user_id, data, descricao, categoria, pagamento, valor)
    values(auth.uid(), r.data_inicio, r.descricao, r.categoria, r.pagamento, r.valor);
  update public.recorrencias set data_inicio = to_char(proxima, 'DD/MM/YYYY'),
    dia_base = base, status = case when fim is not null and proxima > fim then 'encerrada' else 'ativa' end
    where id = r.id and user_id = auth.uid();
  return true;
end;
$$;
revoke all on function public.confirmar_recorrencia(bigint, text) from public, anon;
grant execute on function public.confirmar_recorrencia(bigint, text) to authenticated;
