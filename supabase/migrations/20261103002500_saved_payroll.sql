-- Nóminas guardadas: las personas con cuenta guardan lo que anotan en las
-- calculadoras de nómina (días, turnos, horas y novedades) por período, y
-- ven el total estimado que les debería llegar.
--
-- Privacidad: cada fila solo la ve y la cambia su dueña (RLS). Nadie más la
-- lee, ni moderación ni administración. Se borra en cascada al eliminar la
-- cuenta. No se guarda nombre de empresa ni documento: solo los valores que
-- la persona escribió en la calculadora.

create table public.payroll_records (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  calculator text not null check (calculator in ('administrativos', 'operativos', 'vigilantes', 'por-dias')),
  period_key text not null check (period_key ~ '^[0-9]{4}-[0-9]{2}-(mensual|q1|q2)$'),
  data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 60000),
  net_estimate bigint not null default 0 check (net_estimate between -100000000000 and 100000000000),
  worked_days int not null default 0 check (worked_days between 0 and 31),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, calculator, period_key)
);

alter table public.payroll_records enable row level security;

create policy payroll_records_owner_select on public.payroll_records
  for select to authenticated using (user_id = (select auth.uid()));
create policy payroll_records_owner_insert on public.payroll_records
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy payroll_records_owner_update on public.payroll_records
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy payroll_records_owner_delete on public.payroll_records
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.payroll_records from public, anon;
grant select, insert, update, delete on public.payroll_records to authenticated;

-- Fecha de actualización y límite de períodos por cuenta (unos 10 años de quincenas).
create or replace function private.payroll_records_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and (select count(*) from public.payroll_records where user_id = new.user_id) >= 500 then
    perform private.raise_business_error('VL090', 'Llegaste al máximo de períodos guardados. Borra algunos antiguos desde Mi cuenta.');
  end if;
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

create trigger payroll_records_guard
  before insert or update on public.payroll_records
  for each row execute function private.payroll_records_guard();
