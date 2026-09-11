-- CreditScope: konta Supabase Auth, profile użytkowników i zapisane analizy.
-- Migrację uruchom w Supabase SQL Editor albo przez Supabase CLI.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username varchar(50) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username = btrim(username)
    and username ~ '^[[:alnum:]_.-]{3,50}$'
  )
);

create unique index profiles_username_lower_key on public.profiles (lower(username));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'username'), ''), 'user-' || left(new.id::text, 8))
  );
  return new;
end;
$$;

create trigger auth_user_created_profile
after insert on auth.users
for each row execute procedure public.create_profile_for_new_user();

create table public.saved_analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title varchar(120) not null,
  status varchar(16) not null default 'completed',
  calculation_version varchar(32) not null,
  currency_code char(3) not null default 'PLN',
  loan_amount numeric(14, 2) not null,
  annual_interest_rate numeric(7, 4) not null,
  term_years smallint not null,
  monthly_net_income numeric(14, 2) not null,
  monthly_obligations numeric(14, 2) not null,
  monthly_installment numeric(14, 2) not null,
  total_repayment_amount numeric(14, 2) not null,
  total_credit_cost numeric(14, 2) not null,
  total_interest_amount numeric(14, 2) not null,
  debt_burden_ratio numeric(7, 4) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint saved_analysis_title_not_blank check (length(btrim(title)) between 1 and 120),
  constraint saved_analysis_status check (status = 'completed'),
  constraint saved_analysis_currency check (currency_code = 'PLN'),
  constraint saved_analysis_input_values check (
    loan_amount > 0
    and annual_interest_rate >= 0
    and term_years > 0
    and monthly_net_income > 0
    and monthly_obligations >= 0
  ),
  constraint saved_analysis_result_values check (
    monthly_installment >= 0
    and total_repayment_amount >= loan_amount
    and total_credit_cost >= 0
    and total_interest_amount >= 0
    and debt_burden_ratio >= 0
    and abs(total_credit_cost - (total_repayment_amount - loan_amount)) <= 0.01
  )
);

create trigger saved_analysis_set_updated_at
before update on public.saved_analysis
for each row execute procedure public.set_updated_at();

create index saved_analysis_owner_created_at_idx
on public.saved_analysis (user_id, created_at desc)
where deleted_at is null;

create table public.analysis_schedule_item (
  analysis_id uuid not null references public.saved_analysis (id) on delete cascade,
  installment_number integer not null,
  installment_amount numeric(14, 2) not null,
  principal_amount numeric(14, 2) not null,
  interest_amount numeric(14, 2) not null,
  remaining_balance numeric(14, 2) not null,
  primary key (analysis_id, installment_number),
  constraint analysis_schedule_item_values check (
    installment_number > 0
    and installment_amount >= 0
    and principal_amount >= 0
    and interest_amount >= 0
    and remaining_balance >= 0
    and abs(installment_amount - (principal_amount + interest_amount)) <= 0.01
  )
);

alter table public.profiles enable row level security;
alter table public.saved_analysis enable row level security;
alter table public.analysis_schedule_item enable row level security;

create policy "Users read their profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Users update their username"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users read their analyses"
on public.saved_analysis for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users read their own schedules"
on public.analysis_schedule_item for select to authenticated
using (
  exists (
    select 1
    from public.saved_analysis
    where saved_analysis.id = analysis_schedule_item.analysis_id
      and saved_analysis.user_id = (select auth.uid())
  )
);

create or replace function public.save_analysis(
  p_title text,
  p_calculation_version text,
  p_input jsonb,
  p_result jsonb,
  p_schedule jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  analysis_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;

  if jsonb_typeof(p_schedule) <> 'array' or jsonb_array_length(p_schedule) = 0 then
    raise exception 'A completed analysis requires a repayment schedule.' using errcode = '22023';
  end if;

  insert into public.saved_analysis (
    user_id,
    title,
    calculation_version,
    loan_amount,
    annual_interest_rate,
    term_years,
    monthly_net_income,
    monthly_obligations,
    monthly_installment,
    total_repayment_amount,
    total_credit_cost,
    total_interest_amount,
    debt_burden_ratio
  )
  values (
    current_user_id,
    p_title,
    p_calculation_version,
    (p_input ->> 'loanAmount')::numeric,
    (p_input ->> 'annualInterestRate')::numeric,
    (p_input ->> 'termYears')::smallint,
    (p_input ->> 'monthlyNetIncome')::numeric,
    (p_input ->> 'monthlyObligations')::numeric,
    (p_result ->> 'monthlyInstallment')::numeric,
    (p_result ->> 'totalRepaymentAmount')::numeric,
    (p_result ->> 'totalCreditCost')::numeric,
    (p_result ->> 'totalInterestAmount')::numeric,
    (p_result ->> 'debtBurdenRatio')::numeric
  )
  returning id into analysis_id;

  insert into public.analysis_schedule_item (
    analysis_id,
    installment_number,
    installment_amount,
    principal_amount,
    interest_amount,
    remaining_balance
  )
  select
    analysis_id,
    (item ->> 'installmentNumber')::integer,
    (item ->> 'installmentAmount')::numeric,
    (item ->> 'principalAmount')::numeric,
    (item ->> 'interestAmount')::numeric,
    (item ->> 'remainingBalance')::numeric
  from jsonb_array_elements(p_schedule) as item;

  return analysis_id;
end;
$$;

revoke all on function public.save_analysis(text, text, jsonb, jsonb, jsonb) from public;
grant execute on function public.save_analysis(text, text, jsonb, jsonb, jsonb) to authenticated;

create or replace function public.soft_delete_analysis(p_analysis_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.saved_analysis
  set deleted_at = now()
  where id = p_analysis_id
    and user_id = auth.uid()
    and deleted_at is null;

  if not found then
    raise exception 'Analysis was not found.' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.soft_delete_analysis(uuid) from public;
grant execute on function public.soft_delete_analysis(uuid) to authenticated;

grant select on public.profiles to authenticated;
grant update (username) on public.profiles to authenticated;
grant select on public.saved_analysis to authenticated;
grant select on public.analysis_schedule_item to authenticated;
