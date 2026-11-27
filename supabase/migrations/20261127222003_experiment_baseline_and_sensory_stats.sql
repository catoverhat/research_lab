-- The experiment report: a chosen reference to compare against, sensory scores only on runs that
-- happened, per-attribute statistics and cost per serving at the run's date.
-- Tests: supabase/tests/experiment_report.sql. No new tables: existing grants and RLS apply.

-- ---------------------------------------------------------------------------
-- "Comparar con": the experiment this one is compared against (its control or reference).
-- shortcut: like every FK here it does not check the owner (see "Atajos conocidos"); RLS still
-- hides other users' rows, so a foreign reference shows as missing.
-- ---------------------------------------------------------------------------

alter table public.experiments
  add column baseline_experiment_id uuid references public.experiments (id) on delete set null,
  add constraint experiments_baseline_not_self check (baseline_experiment_id <> id);

create index on public.experiments (baseline_experiment_id);

-- ---------------------------------------------------------------------------
-- Sensory scores are results: only a completed or failed run has them.
-- ---------------------------------------------------------------------------

create function public.require_recorded_experiment_for_evaluation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.experiments e
    where e.id = new.experiment_id and e.status in ('completed', 'failed')
  ) then
    raise exception 'sensory evaluations need a completed or failed experiment'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function public.require_recorded_experiment_for_evaluation() from public, anon, authenticated, service_role;

create trigger require_recorded_experiment_for_evaluation
before insert or update of experiment_id on public.sensory_evaluations
for each row execute function public.require_recorded_experiment_for_evaluation();

-- ---------------------------------------------------------------------------
-- Statistics per experiment and attribute. stddev is null with one evaluation (unknown, not 0).
-- ---------------------------------------------------------------------------

create view public.v_experiment_sensory with (security_invoker = true) as
select
  se.experiment_id,
  se.attribute,
  count(*) as evaluations,
  avg(se.score) as avg_score,
  min(se.score) as min_score,
  max(se.score) as max_score,
  stddev_samp(se.score) as stddev_score
from public.sensory_evaluations se
group by se.experiment_id, se.attribute;

revoke all on table public.v_experiment_sensory from anon, authenticated;
grant select on table public.v_experiment_sensory to authenticated;

-- ---------------------------------------------------------------------------
-- The summary gains servings, cost per serving (at the run's date) and the reference.
-- New columns go last so the view can be replaced in place; v_research_context picks them up.
-- ---------------------------------------------------------------------------

create or replace view public.v_experiment_summary with (security_invoker = true) as
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
  sensory.overall_score,
  f.servings,
  cost.total_cost / f.servings as cost_per_serving,
  e.baseline_experiment_id
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
