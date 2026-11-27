-- What the experiment report needs from the database: a chosen reference ("Comparar con"),
-- sensory scores only on runs that happened, per-attribute statistics, and cost per serving.
begin;

select plan(15);

insert into auth.users (id, raw_app_meta_data, raw_user_meta_data) values
  ('10000000-0000-0000-0000-0000000000d1', '{}', '{}'),
  ('10000000-0000-0000-0000-0000000000d2', '{}', '{}');

select has_column('public', 'experiments', 'baseline_experiment_id', 'experiments can name their reference');
select has_view('public', 'v_experiment_sensory', 'per-experiment sensory statistics view exists');
select is(
  (select count(*) from unnest(array['anon', 'authenticated', 'service_role']) r(role)
   where has_function_privilege(r.role, 'public.require_recorded_experiment_for_evaluation()', 'execute')),
  0::bigint,
  'no API role can call the new trigger function'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);

insert into public.research_projects (id, title) values ('20000000-0000-0000-0000-0000000000d1', 'Report');
insert into public.products (id, name, package_size, unit) values ('30000000-0000-0000-0000-0000000000d1', 'Base', 1000, 'g');
insert into public.product_prices (product_id, price, observed_on) values ('30000000-0000-0000-0000-0000000000d1', 100, '2026-01-01');
insert into public.formulations (id, project_id, code, version, servings) values
  ('40000000-0000-0000-0000-0000000000d1', '20000000-0000-0000-0000-0000000000d1', 'F01', 1, 2),
  ('40000000-0000-0000-0000-0000000000d2', '20000000-0000-0000-0000-0000000000d1', 'F01', 2, 2);
insert into public.formulation_ingredients (formulation_id, product_id, quantity) values
  ('40000000-0000-0000-0000-0000000000d1', '30000000-0000-0000-0000-0000000000d1', 100),
  ('40000000-0000-0000-0000-0000000000d2', '30000000-0000-0000-0000-0000000000d1', 150);
insert into public.experiments (id, formulation_id, status, performed_on) values
  ('50000000-0000-0000-0000-0000000000d1', '40000000-0000-0000-0000-0000000000d1', 'completed', '2026-03-01'),
  ('50000000-0000-0000-0000-0000000000d2', '40000000-0000-0000-0000-0000000000d2', 'completed', '2026-03-08'),
  ('50000000-0000-0000-0000-0000000000d3', '40000000-0000-0000-0000-0000000000d2', 'planned', null);

-- The reference ("Comparar con").
select throws_ok(
  $$ update public.experiments set baseline_experiment_id = id where id = '50000000-0000-0000-0000-0000000000d1' $$,
  '23514', null, 'an experiment cannot be its own reference'
);
select lives_ok(
  $$ update public.experiments set baseline_experiment_id = '50000000-0000-0000-0000-0000000000d1'
     where id = '50000000-0000-0000-0000-0000000000d2' $$,
  'an experiment can be compared with another one'
);

-- Sensory scores only on runs that happened.
select throws_ok(
  $$ insert into public.sensory_evaluations (experiment_id, evaluator, attribute, score)
     values ('50000000-0000-0000-0000-0000000000d3', 'ana', 'overall', 7) $$,
  '23514', null, 'a planned experiment cannot be scored'
);
select lives_ok(
  $$ insert into public.sensory_evaluations (experiment_id, evaluator, attribute, score) values
       ('50000000-0000-0000-0000-0000000000d1', 'ana', 'overall', 8),
       ('50000000-0000-0000-0000-0000000000d1', 'luis', 'overall', 6),
       ('50000000-0000-0000-0000-0000000000d1', 'ana', 'amargor', 5) $$,
  'a completed experiment is scored by several evaluators'
);
select throws_ok(
  $$ update public.sensory_evaluations set experiment_id = '50000000-0000-0000-0000-0000000000d3'
     where evaluator = 'ana' and attribute = 'amargor' $$,
  '23514', null, 'a score cannot be moved to a planned experiment'
);

-- Statistics per experiment and attribute.
select is(
  (select row(evaluations, trim_scale(avg_score), min_score, max_score, round(stddev_score, 3))::text from public.v_experiment_sensory
   where experiment_id = '50000000-0000-0000-0000-0000000000d1' and attribute = 'overall'),
  row(2::bigint, 7::numeric, 6::numeric, 8::numeric, 1.414::numeric)::text,
  'overall: two evaluations, mean 7, range 6-8, sample deviation 1.414'
);
select is(
  (select row(evaluations, stddev_score)::text from public.v_experiment_sensory
   where experiment_id = '50000000-0000-0000-0000-0000000000d1' and attribute = 'amargor'),
  row(1::bigint, null::numeric)::text,
  'one evaluation has no deviation (null, never 0)'
);

-- Cost per serving at the run's date, and the reference, in the summary.
select is(
  (select row(baseline_experiment_id, trim_scale(total_cost), servings, trim_scale(cost_per_serving))::text
   from public.v_experiment_summary
   where experiment_id = '50000000-0000-0000-0000-0000000000d2'),
  row('50000000-0000-0000-0000-0000000000d1'::uuid, 15::numeric, 2::numeric, 7.5::numeric)::text,
  'the summary carries the reference and the cost per serving (150 g x 0.10 / 2)'
);

-- Deleting the reference keeps the experiment and clears the link.
delete from public.experiments where id = '50000000-0000-0000-0000-0000000000d1';
select is(
  (select baseline_experiment_id from public.experiments where id = '50000000-0000-0000-0000-0000000000d2'),
  null,
  'deleting the reference leaves the experiment without one'
);
select is(
  (select count(*) from public.sensory_evaluations where experiment_id = '50000000-0000-0000-0000-0000000000d1'),
  0::bigint,
  'the deleted experiment takes its scores with it'
);

-- Another user sees nothing (security_invoker views run with the caller's RLS).
insert into public.sensory_evaluations (experiment_id, evaluator, attribute, score)
values ('50000000-0000-0000-0000-0000000000d2', 'ana', 'overall', 9);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-0000000000d2","role":"authenticated"}', true);
select is(
  (select count(*) from public.v_experiment_summary where project_id = '20000000-0000-0000-0000-0000000000d1'),
  0::bigint,
  'another user does not see the summaries'
);
select is(
  (select count(*) from public.v_experiment_sensory where experiment_id = '50000000-0000-0000-0000-0000000000d2'),
  0::bigint,
  'another user does not see the sensory statistics'
);

select * from finish();

rollback;
