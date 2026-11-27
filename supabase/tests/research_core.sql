begin;

select plan(27);

insert into auth.users (id, raw_app_meta_data, raw_user_meta_data) values
  ('10000000-0000-0000-0000-00000000000a', '{}', '{}'),
  ('10000000-0000-0000-0000-00000000000b', '{}', '{}');

select is(
  (select count(*) from pg_tables where schemaname = 'public' and not rowsecurity),
  0::bigint,
  'every public table has RLS enabled'
);

-- User A records a small study through the API role, never passing owner_id.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

insert into public.research_projects (id, title)
values ('20000000-0000-0000-0000-000000000001', 'Chocolate test');

insert into public.products (id, brand, name, package_size, unit) values
  ('30000000-0000-0000-0000-000000000001', 'Cacao Co', 'Cacao', 500, 'g'),
  ('30000000-0000-0000-0000-000000000002', 'Milk Co', 'Leche', 1000, 'ml');

-- Cacao costs 0.20/g in March and 0.30/g from June; milk 0.08/ml.
insert into public.product_prices (product_id, price, observed_on) values
  ('30000000-0000-0000-0000-000000000001', 100, '2026-01-01'),
  ('30000000-0000-0000-0000-000000000001', 150, '2026-06-01'),
  ('30000000-0000-0000-0000-000000000002', 80, '2026-01-01');

insert into public.product_nutrition (product_id, energy_kcal) values
  ('30000000-0000-0000-0000-000000000001', 400),
  ('30000000-0000-0000-0000-000000000002', 50);

insert into public.formulations (id, project_id, code, servings)
values ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'F01', 2);

insert into public.formulation_ingredients (formulation_id, product_id, quantity) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 50),
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 500);

insert into public.experiments (id, formulation_id, status, performed_on)
values ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'completed', '2026-03-01');

insert into public.sensory_evaluations (experiment_id, evaluator, attribute, score) values
  ('50000000-0000-0000-0000-000000000001', 'a', 'overall', 8),
  ('50000000-0000-0000-0000-000000000001', 'b', 'overall', 6);

-- Views
select is(
  (select total_cost from public.v_formulation_cost where code = 'F01'),
  55::numeric,
  'formulation cost uses the latest prices (50 g x 0.30 + 500 ml x 0.08)'
);

select is(
  (select cost_per_serving from public.v_formulation_cost where code = 'F01'),
  27.5::numeric,
  'cost per serving divides by servings'
);

select is(
  (select total_cost from public.v_experiment_summary where experiment_id = '50000000-0000-0000-0000-000000000001'),
  50::numeric,
  'experiment cost uses prices as of the day it ran, not later ones'
);

select is(
  (select overall_score from public.v_experiment_summary where experiment_id = '50000000-0000-0000-0000-000000000001'),
  7::numeric,
  'experiment summary averages the overall score'
);

select is(
  (select energy_kcal from public.v_formulation_nutrition where code = 'F01'),
  225::numeric,
  'nutrition is per serving ((200 + 250) kcal / 2)'
);

select is(
  (select avg_score from public.v_sensory_comparison where code = 'F01' and attribute = 'overall'),
  7::numeric,
  'sensory comparison averages per attribute'
);

select is(
  (
    select array[
      jsonb_array_length(context -> 'formulations'),
      jsonb_array_length(context -> 'experiments'),
      jsonb_array_length(context -> 'products'),
      jsonb_array_length(context -> 'experiments' -> 0 -> 'evaluations')
    ]
    from public.v_research_context
    where project_id = '20000000-0000-0000-0000-000000000001'
  ),
  array[1, 1, 2, 2],
  'research context export bundles formulations, experiments, products and evaluations'
);

-- A tested formulation is frozen; changes go into a new version.
insert into public.products (id, name, package_size, unit)
values ('30000000-0000-0000-0000-000000000003', 'Canela', 50, 'g');

select throws_ok(
  $$ insert into public.formulation_ingredients (formulation_id, product_id, quantity)
     values ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 1) $$,
  '23514', 'formulation already has recorded experiments; create a new version instead',
  'cannot add ingredients to a tested formulation'
);

select throws_ok(
  $$ update public.formulation_ingredients set quantity = 60
     where formulation_id = '40000000-0000-0000-0000-000000000001' $$,
  '23514', 'formulation already has recorded experiments; create a new version instead',
  'cannot change quantities of a tested formulation'
);

select throws_ok(
  $$ delete from public.formulation_ingredients
     where formulation_id = '40000000-0000-0000-0000-000000000001' $$,
  '23514', 'formulation already has recorded experiments; create a new version instead',
  'cannot remove ingredients from a tested formulation'
);

insert into public.formulations (id, project_id, code, version, parent_id, servings)
values ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'F01', 2,
        '40000000-0000-0000-0000-000000000001', 2);

select lives_ok(
  $$ insert into public.formulation_ingredients (formulation_id, product_id, quantity)
     values ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 60) $$,
  'a new version of the formulation can be edited'
);

-- Attachments and storage stay inside the owner's folder.
select throws_ok(
  $$ insert into public.attachments (storage_path, kind)
     values ('10000000-0000-0000-0000-00000000000b/label.jpg', 'label') $$,
  '23514', null,
  'attachment metadata must point inside the owner folder'
);

select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('attachments', '10000000-0000-0000-0000-00000000000a/label.jpg') $$,
  'an owner can upload into their own folder'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('attachments', '10000000-0000-0000-0000-00000000000b/label.jpg') $$,
  '42501', null,
  'an owner cannot upload into another user folder'
);

-- User B sees nothing of A and cannot write as A.
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-00000000000b","role":"authenticated","is_anonymous":true}', true);

select is((select count(*) from public.research_projects), 0::bigint, 'another user cannot read projects');
select is((select count(*) from public.product_prices), 0::bigint, 'another user cannot read prices');
select is((select count(*) from public.v_research_context), 0::bigint, 'another user cannot read the context export');
select is(
  (select count(*) from storage.objects where bucket_id = 'attachments'),
  0::bigint,
  'another user cannot list attachment files'
);

select throws_ok(
  $$ insert into public.research_projects (owner_id, title)
     values ('10000000-0000-0000-0000-00000000000a', 'forged') $$,
  '42501', null,
  'another user cannot insert rows owned by someone else'
);

update public.research_projects set title = 'hacked' where id = '20000000-0000-0000-0000-000000000001';
delete from public.product_prices;

select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select is(
  (select title from public.research_projects where id = '20000000-0000-0000-0000-000000000001'),
  'Chocolate test',
  'another user cannot update projects'
);

select is((select count(*) from public.product_prices), 3::bigint, 'another user cannot delete prices');

-- Anonymous API key: no table access, only keepalive.
reset role;
set local role anon;

select throws_ok('select * from public.research_projects', '42501', null, 'anon cannot read tables');
select throws_ok('select * from public.v_research_context', '42501', null, 'anon cannot read views');
select is(public.keepalive(), 1, 'anon can call keepalive');

-- Deleting a user removes all their research, even a frozen formulation.
reset role;

select lives_ok(
  $$ delete from auth.users where id = '10000000-0000-0000-0000-00000000000a' $$,
  'deleting a user cascades through frozen formulations'
);

select is(
  (select count(*) from public.formulation_ingredients where owner_id = '10000000-0000-0000-0000-00000000000a'),
  0::bigint,
  'the deleted user leaves no rows behind'
);

select * from finish();
rollback;
