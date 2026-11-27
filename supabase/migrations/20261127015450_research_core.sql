-- Food Research Lab: core research schema.
-- Every row belongs to one user (owner_id) and RLS only lets that user see or change it.
-- See docs/database-design.md for the model and the reasoning behind it.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.research_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  objective text,
  scope text,
  status text not null default 'active'
    check (status in ('planned', 'active', 'paused', 'completed', 'archived')),
  created_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid references public.research_projects (id) on delete set null,
  kind text not null
    check (kind in ('bibliographic', 'commercial', 'label', 'observation', 'other')),
  title text not null,
  url text,
  citation text,
  accessed_on date,
  notes text,
  created_at timestamptz not null default now()
);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  category text,
  notes text,
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  kind text not null default 'supermarket'
    check (kind in ('supermarket', 'online', 'market', 'other')),
  location text,
  url text,
  notes text,
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

-- One row per commercial presentation: "Munné 16 oz" and "Munné 5 oz" are two products.
create table public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  ingredient_id uuid references public.ingredients (id) on delete set null,
  brand text,
  name text not null,
  package_size numeric not null check (package_size > 0),
  unit text not null check (unit in ('g', 'ml', 'unit')),
  barcode text,
  notes text,
  created_at timestamptz not null default now(),
  unique nulls not distinct (owner_id, brand, name, package_size, unit)
);

-- Label values per basis_quantity of the product's unit (100 g, 100 ml or 1 unit).
create table public.product_nutrition (
  product_id uuid primary key references public.products (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  basis_quantity numeric not null default 100 check (basis_quantity > 0),
  energy_kcal numeric,
  fat_g numeric,
  saturated_fat_g numeric,
  carbohydrates_g numeric,
  sugars_g numeric,
  fiber_g numeric,
  protein_g numeric,
  sodium_mg numeric,
  source_id uuid references public.sources (id) on delete set null,
  created_at timestamptz not null default now(),
  check (least(energy_kcal, fat_g, saturated_fat_g, carbohydrates_g, sugars_g, fiber_g, protein_g, sodium_mg) >= 0)
);

-- Append-only price history: a new observation is a new row, never an update.
create table public.product_prices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  supplier_id uuid references public.suppliers (id) on delete set null,
  price numeric(12, 2) not null check (price >= 0),
  currency text not null default 'DOP' check (currency ~ '^[A-Z]{3}$'),
  observed_on date not null default current_date,
  in_stock boolean,
  source_id uuid references public.sources (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- A recipe version. Changing a tested recipe means inserting a new version (parent_id = previous).
create table public.formulations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid not null references public.research_projects (id) on delete cascade,
  code text not null,
  version integer not null default 1 check (version > 0),
  parent_id uuid references public.formulations (id) on delete set null,
  name text,
  status text not null default 'draft'
    check (status in ('draft', 'proposed', 'tested', 'validated', 'discarded')),
  servings numeric check (servings > 0),
  instructions text,
  notes text,
  created_at timestamptz not null default now(),
  unique (project_id, code, version)
);

-- quantity is in the product's unit (g, ml or unit), so cost and nutrition need no conversion.
create table public.formulation_ingredients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  formulation_id uuid not null references public.formulations (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity numeric not null check (quantity > 0),
  notes text,
  created_at timestamptz not null default now(),
  unique (formulation_id, product_id)
);

create table public.hypotheses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid not null references public.research_projects (id) on delete cascade,
  statement text not null,
  rationale text,
  status text not null default 'pending'
    check (status in ('pending', 'testing', 'supported', 'refuted', 'inconclusive')),
  created_at timestamptz not null default now()
);

-- One execution of a formulation. The formulation FK has no cascade so history cannot vanish.
create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  formulation_id uuid not null references public.formulations (id),
  hypothesis_id uuid references public.hypotheses (id) on delete set null,
  status text not null default 'planned'
    check (status in ('planned', 'completed', 'failed', 'cancelled')),
  performed_on date,
  conditions text,
  observations text,
  created_at timestamptz not null default now(),
  check (status in ('planned', 'cancelled') or performed_on is not null)
);

-- One score per evaluator and attribute (0-10). Attributes are free text so any food fits.
create table public.sensory_evaluations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  experiment_id uuid not null references public.experiments (id) on delete cascade,
  evaluator text not null default 'self',
  attribute text not null,
  score numeric not null check (score between 0 and 10),
  comment text,
  created_at timestamptz not null default now(),
  unique (experiment_id, evaluator, attribute)
);

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid not null references public.research_projects (id) on delete cascade,
  statement text not null,
  evidence_level text not null
    check (evidence_level in ('confirmed', 'preliminary', 'anecdotal')),
  hypothesis_id uuid references public.hypotheses (id) on delete set null,
  experiment_id uuid references public.experiments (id) on delete set null,
  source_id uuid references public.sources (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Metadata for a file in the private 'attachments' bucket, stored under '<owner_id>/...'.
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  storage_path text not null unique,
  kind text not null check (kind in ('photo', 'label', 'invoice', 'document', 'other')),
  project_id uuid references public.research_projects (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  experiment_id uuid references public.experiments (id) on delete set null,
  source_id uuid references public.sources (id) on delete set null,
  caption text,
  created_at timestamptz not null default now(),
  check (starts_with(storage_path, owner_id::text || '/'))
);

create table public.research_reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid not null references public.research_projects (id) on delete cascade,
  version integer not null check (version > 0),
  title text not null,
  content_md text not null,
  created_at timestamptz not null default now(),
  unique (project_id, version)
);

-- ---------------------------------------------------------------------------
-- Foreign-key indexes (FKs not already leading a unique/primary key)
-- ---------------------------------------------------------------------------

create index on public.sources (project_id);
create index on public.products (ingredient_id);
create index on public.product_nutrition (source_id);
create index on public.product_prices (product_id, observed_on desc);
create index on public.product_prices (supplier_id);
create index on public.product_prices (source_id);
create index on public.formulations (parent_id);
create index on public.formulation_ingredients (product_id);
create index on public.hypotheses (project_id);
create index on public.experiments (formulation_id);
create index on public.experiments (hypothesis_id);
create index on public.findings (project_id);
create index on public.findings (hypothesis_id);
create index on public.findings (experiment_id);
create index on public.findings (source_id);
create index on public.attachments (project_id);
create index on public.attachments (product_id);
create index on public.attachments (experiment_id);
create index on public.attachments (source_id);

-- ---------------------------------------------------------------------------
-- RLS, grants and owner policies: identical for every table
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'research_projects', 'sources', 'ingredients', 'suppliers', 'products',
    'product_nutrition', 'product_prices', 'formulations', 'formulation_ingredients',
    'hypotheses', 'experiments', 'sensory_evaluations', 'findings', 'attachments',
    'research_reports'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format('create index on public.%I (owner_id)', t);
    execute format(
      'create policy "Owners read their rows" on public.%I for select to authenticated
         using ((select auth.uid()) = owner_id)', t);
    execute format(
      'create policy "Owners insert their rows" on public.%I for insert to authenticated
         with check ((select auth.uid()) = owner_id)', t);
    execute format(
      'create policy "Owners update their rows" on public.%I for update to authenticated
         using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id)', t);
    execute format(
      'create policy "Owners delete their rows" on public.%I for delete to authenticated
         using ((select auth.uid()) = owner_id)', t);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- A formulation with completed or failed experiments is frozen.
-- ---------------------------------------------------------------------------

create function public.lock_tested_formulation_ingredients()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Nested calls are FK cascades (deleting a formulation, project or user); FKs guard those.
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  if exists (
    select 1
    from public.experiments e
    where e.formulation_id in (old.formulation_id, new.formulation_id)
      and e.status in ('completed', 'failed')
  ) then
    raise exception 'formulation already has recorded experiments; create a new version instead'
      using errcode = 'check_violation';
  end if;

  return null;
end;
$$;

revoke execute on function public.lock_tested_formulation_ingredients() from public, anon, authenticated;

create trigger lock_tested_formulation_ingredients
after insert or update or delete on public.formulation_ingredients
for each row execute function public.lock_tested_formulation_ingredients();

-- ---------------------------------------------------------------------------
-- Storage: private bucket, each user only touches '<their uid>/...'
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false);

create policy "Owners read their attachment files" on storage.objects
for select to authenticated
using (bucket_id = 'attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Owners upload their attachment files" on storage.objects
for insert to authenticated
with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Owners update their attachment files" on storage.objects
for update to authenticated
using (bucket_id = 'attachments' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Owners delete their attachment files" on storage.objects
for delete to authenticated
using (bucket_id = 'attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------------------
-- Analysis views. security_invoker makes them respect the caller's RLS.
-- shortcut: sums assume one currency per owner; group by currency once a second one appears.
-- ---------------------------------------------------------------------------

create view public.v_price_history with (security_invoker = true) as
select
  pp.id as price_id,
  pp.product_id,
  p.brand,
  p.name as product,
  p.package_size,
  p.unit,
  s.name as supplier,
  pp.price,
  pp.currency,
  pp.observed_on,
  pp.in_stock,
  pp.price / p.package_size as unit_cost,
  pp.created_at
from public.product_prices pp
join public.products p on p.id = pp.product_id
left join public.suppliers s on s.id = pp.supplier_id;

-- Latest observed price per product.
create view public.v_product_unit_cost with (security_invoker = true) as
select distinct on (product_id) *
from public.v_price_history
order by product_id, observed_on desc, created_at desc;

-- Cost of one batch at current prices.
create view public.v_formulation_cost with (security_invoker = true) as
select
  f.id as formulation_id,
  f.project_id,
  f.code,
  f.version,
  f.servings,
  sum(fi.quantity * c.unit_cost) as total_cost,
  sum(fi.quantity * c.unit_cost) / f.servings as cost_per_serving,
  count(*) filter (where c.unit_cost is null) as ingredients_without_price
from public.formulations f
join public.formulation_ingredients fi on fi.formulation_id = f.id
left join public.v_product_unit_cost c on c.product_id = fi.product_id
group by f.id;

-- Nutrition per serving (whole batch when servings is null).
create view public.v_formulation_nutrition with (security_invoker = true) as
select
  f.id as formulation_id,
  f.project_id,
  f.code,
  f.version,
  f.servings,
  sum(fi.quantity / n.basis_quantity * n.energy_kcal) / coalesce(f.servings, 1) as energy_kcal,
  sum(fi.quantity / n.basis_quantity * n.fat_g) / coalesce(f.servings, 1) as fat_g,
  sum(fi.quantity / n.basis_quantity * n.saturated_fat_g) / coalesce(f.servings, 1) as saturated_fat_g,
  sum(fi.quantity / n.basis_quantity * n.carbohydrates_g) / coalesce(f.servings, 1) as carbohydrates_g,
  sum(fi.quantity / n.basis_quantity * n.sugars_g) / coalesce(f.servings, 1) as sugars_g,
  sum(fi.quantity / n.basis_quantity * n.fiber_g) / coalesce(f.servings, 1) as fiber_g,
  sum(fi.quantity / n.basis_quantity * n.protein_g) / coalesce(f.servings, 1) as protein_g,
  sum(fi.quantity / n.basis_quantity * n.sodium_mg) / coalesce(f.servings, 1) as sodium_mg,
  count(*) filter (where n.product_id is null) as ingredients_without_nutrition
from public.formulations f
join public.formulation_ingredients fi on fi.formulation_id = f.id
left join public.product_nutrition n on n.product_id = fi.product_id
group by f.id;

-- Each experiment costed with the latest price observed on or before the day it was run,
-- so later price changes never rewrite historical costs.
create view public.v_experiment_summary with (security_invoker = true) as
select
  e.id as experiment_id,
  e.formulation_id,
  f.project_id,
  f.code,
  f.version,
  e.hypothesis_id,
  e.status,
  e.performed_on,
  e.conditions,
  e.observations,
  cost.total_cost,
  cost.ingredients_without_price,
  sensory.evaluations,
  sensory.overall_score
from public.experiments e
join public.formulations f on f.id = e.formulation_id
cross join lateral (
  select
    sum(fi.quantity * price.unit_cost) as total_cost,
    count(*) filter (where price.unit_cost is null) as ingredients_without_price
  from public.formulation_ingredients fi
  join public.products p on p.id = fi.product_id
  left join lateral (
    select pp.price / p.package_size as unit_cost
    from public.product_prices pp
    where pp.product_id = fi.product_id
      and pp.observed_on <= coalesce(e.performed_on, current_date)
    order by pp.observed_on desc, pp.created_at desc
    limit 1
  ) price on true
  where fi.formulation_id = e.formulation_id
) cost
cross join lateral (
  select
    count(*) as evaluations,
    avg(se.score) filter (where se.attribute = 'overall') as overall_score
  from public.sensory_evaluations se
  where se.experiment_id = e.id
) sensory;

-- Average score per formulation and attribute across completed experiments.
create view public.v_sensory_comparison with (security_invoker = true) as
select
  f.project_id,
  f.id as formulation_id,
  f.code,
  f.version,
  se.attribute,
  count(*) as evaluations,
  avg(se.score) as avg_score
from public.sensory_evaluations se
join public.experiments e on e.id = se.experiment_id
join public.formulations f on f.id = e.formulation_id
where e.status = 'completed'
group by f.id, se.attribute;

-- One JSON document per project with everything needed to resume the research elsewhere
-- (for example pasted into a new AI conversation). Filter by project_id.
create view public.v_research_context with (security_invoker = true) as
select
  rp.id as project_id,
  jsonb_build_object(
    'exported_at', now(),
    'project', to_jsonb(rp),
    'hypotheses', coalesce((
      select jsonb_agg(to_jsonb(h) order by h.created_at)
      from public.hypotheses h
      where h.project_id = rp.id
    ), '[]'::jsonb),
    'findings', coalesce((
      select jsonb_agg(to_jsonb(fd) order by fd.created_at)
      from public.findings fd
      where fd.project_id = rp.id
    ), '[]'::jsonb),
    'formulations', coalesce((
      select jsonb_agg(
        to_jsonb(f) || jsonb_build_object(
          'ingredients', coalesce((
            select jsonb_agg(to_jsonb(fi) order by fi.created_at)
            from public.formulation_ingredients fi
            where fi.formulation_id = f.id
          ), '[]'::jsonb),
          'cost', (select to_jsonb(c) from public.v_formulation_cost c where c.formulation_id = f.id),
          'nutrition', (select to_jsonb(n) from public.v_formulation_nutrition n where n.formulation_id = f.id)
        )
        order by f.code, f.version
      )
      from public.formulations f
      where f.project_id = rp.id
    ), '[]'::jsonb),
    'experiments', coalesce((
      select jsonb_agg(
        to_jsonb(s) || jsonb_build_object(
          'evaluations', coalesce((
            select jsonb_agg(to_jsonb(se) order by se.evaluator, se.attribute)
            from public.sensory_evaluations se
            where se.experiment_id = s.experiment_id
          ), '[]'::jsonb)
        )
        order by s.performed_on nulls last
      )
      from public.v_experiment_summary s
      where s.project_id = rp.id
    ), '[]'::jsonb),
    'products', coalesce((
      select jsonb_agg(
        to_jsonb(p) || jsonb_build_object(
          'nutrition', (select to_jsonb(n) from public.product_nutrition n where n.product_id = p.id),
          'prices', coalesce((
            select jsonb_agg(to_jsonb(ph) order by ph.observed_on, ph.created_at)
            from public.v_price_history ph
            where ph.product_id = p.id
          ), '[]'::jsonb)
        )
        order by p.brand, p.name
      )
      from public.products p
      where p.id in (
        select fi.product_id
        from public.formulation_ingredients fi
        join public.formulations f on f.id = fi.formulation_id
        where f.project_id = rp.id
      )
    ), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(to_jsonb(src) order by src.created_at)
      from public.sources src
      where src.project_id = rp.id
    ), '[]'::jsonb)
  ) as context
from public.research_projects rp;

do $$
declare
  v text;
begin
  foreach v in array array[
    'v_price_history', 'v_product_unit_cost', 'v_formulation_cost', 'v_formulation_nutrition',
    'v_experiment_summary', 'v_sensory_comparison', 'v_research_context'
  ] loop
    execute format('revoke all on table public.%I from anon, authenticated', v);
    execute format('grant select on table public.%I to authenticated', v);
  end loop;
end
$$;
