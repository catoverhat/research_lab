-- Domain rules that live in the database (see "Forma de trabajar" in AGENTS.md):
-- recorded experiments stay recorded, products in use keep their presentation, prices are DOP,
-- and multi-step operations (new recipe version, price with its source) are one transaction.
begin;

select plan(34);

insert into auth.users (id, raw_app_meta_data, raw_user_meta_data) values
  ('10000000-0000-0000-0000-0000000000c1', '{}', '{}'),
  ('10000000-0000-0000-0000-0000000000c2', '{}', '{}');

select has_function('public', 'create_formulation_version', array['uuid'], 'create_formulation_version exists');
select has_function(
  'public', 'add_product_price', array['uuid', 'numeric', 'date', 'text', 'boolean', 'text', 'text'],
  'add_product_price exists'
);

select is(
  (select array_agg(has_function_privilege(r.role, f.fn, 'execute') order by f.fn, r.ord)
   from unnest(array['anon', 'authenticated', 'service_role']) with ordinality r(role, ord),
        unnest(array['public.create_formulation_version(uuid)',
                     'public.add_product_price(uuid, numeric, date, text, boolean, text, text)']) f(fn)),
  array[false, true, false, false, true, false],
  'only authenticated can call the domain functions'
);

select is(
  (select count(*) from unnest(array['anon', 'authenticated', 'service_role']) r(role),
     unnest(array['public.keep_recorded_experiments_recorded()', 'public.lock_used_product_presentation()']) f(fn)
   where has_function_privilege(r.role, f.fn, 'execute')),
  0::bigint,
  'no API role can call the new trigger functions'
);

-- User C1: a recipe with one tested run, a product in use and one that is not.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);

insert into public.research_projects (id, title) values ('20000000-0000-0000-0000-0000000000c1', 'Rules');
insert into public.products (id, brand, name, package_size, unit) values
  ('30000000-0000-0000-0000-0000000000c1', 'Priced', 'Cacao', 500, 'g'),
  ('30000000-0000-0000-0000-0000000000c2', 'InRecipe', 'Leche', 1000, 'ml'),
  ('30000000-0000-0000-0000-0000000000c3', 'Unused', 'Canela', 50, 'g');
insert into public.product_prices (product_id, price, observed_on)
values ('30000000-0000-0000-0000-0000000000c1', 100, '2026-01-01');
insert into public.formulations (id, project_id, code, name, servings) values
  ('40000000-0000-0000-0000-0000000000c1', '20000000-0000-0000-0000-0000000000c1', 'F01', 'Base', 1),
  ('40000000-0000-0000-0000-0000000000c2', '20000000-0000-0000-0000-0000000000c1', 'F02', null, 1);
insert into public.formulation_ingredients (formulation_id, product_id, quantity, notes) values
  ('40000000-0000-0000-0000-0000000000c1', '30000000-0000-0000-0000-0000000000c2', 250, 'Observación: tibia');
insert into public.experiments (id, formulation_id, status, performed_on) values
  ('50000000-0000-0000-0000-0000000000c1', '40000000-0000-0000-0000-0000000000c1', 'completed', '2026-03-01'),
  ('50000000-0000-0000-0000-0000000000c2', '40000000-0000-0000-0000-0000000000c2', 'planned', null);

-- Recorded experiments stay recorded.
select throws_ok(
  $$ update public.experiments set status = 'planned' where id = '50000000-0000-0000-0000-0000000000c1' $$,
  '23514', null, 'a completed experiment cannot go back to planned'
);
select throws_ok(
  $$ update public.experiments set status = 'cancelled' where id = '50000000-0000-0000-0000-0000000000c1' $$,
  '23514', null, 'a completed experiment cannot be cancelled'
);
select throws_ok(
  $$ update public.experiments set formulation_id = '40000000-0000-0000-0000-0000000000c2'
     where id = '50000000-0000-0000-0000-0000000000c1' $$,
  '23514', null, 'a recorded experiment cannot move to another recipe'
);
select lives_ok(
  $$ update public.experiments set status = 'failed' where id = '50000000-0000-0000-0000-0000000000c1' $$,
  'completed can become failed (both are recorded)'
);
select lives_ok(
  $$ update public.experiments set performed_on = '2026-03-02', observations = 'fixed date'
     where id = '50000000-0000-0000-0000-0000000000c1' $$,
  'a recorded experiment keeps its date and notes editable'
);
select lives_ok(
  $$ update public.experiments set status = 'completed', performed_on = '2026-04-01'
     where id = '50000000-0000-0000-0000-0000000000c2' $$,
  'a planned experiment can be recorded'
);

-- Products in use keep their presentation.
select throws_ok(
  $$ update public.products set package_size = 1000 where id = '30000000-0000-0000-0000-0000000000c1' $$,
  '23514', null, 'a product with prices keeps its package size'
);
select throws_ok(
  $$ update public.products set unit = 'g' where id = '30000000-0000-0000-0000-0000000000c2' $$,
  '23514', null, 'a product in a recipe keeps its unit'
);
select lives_ok(
  $$ update public.products set brand = 'Priced 2', notes = 'Pendiente: revisar'
     where id = '30000000-0000-0000-0000-0000000000c1' $$,
  'a product in use keeps its other fields editable'
);
select lives_ok(
  $$ update public.products set package_size = 500, unit = 'g' where id = '30000000-0000-0000-0000-0000000000c1' $$,
  'rewriting the same size and unit on a product in use is not a change'
);
select lives_ok(
  $$ update public.products set package_size = 100, unit = 'unit' where id = '30000000-0000-0000-0000-0000000000c3' $$,
  'an unused product can change its presentation'
);

-- Prices are DOP while the views add amounts without grouping by currency.
select throws_ok(
  $$ insert into public.product_prices (product_id, price, currency)
     values ('30000000-0000-0000-0000-0000000000c3', 5, 'USD') $$,
  '23514', null, 'a price in another currency is rejected'
);

-- New recipe version: one transaction, next version of the code, composition copied, not frozen.
select set_config('test.v2', public.create_formulation_version('40000000-0000-0000-0000-0000000000c1')::text, true);

select is(
  (select row(version, parent_id, status, name, servings)::text from public.formulations
   where id = current_setting('test.v2')::uuid),
  row(2, '40000000-0000-0000-0000-0000000000c1'::uuid, 'draft', 'Base', 1::numeric)::text,
  'the new version is v2 of F01, a draft that points to v1 and keeps its fields'
);
select is(
  (select array_agg(row(product_id, quantity, notes)::text) from public.formulation_ingredients
   where formulation_id = current_setting('test.v2')::uuid),
  array[row('30000000-0000-0000-0000-0000000000c2'::uuid, 250::numeric, 'Observación: tibia')::text],
  'the composition and its notes are copied'
);
select lives_ok(
  $$ insert into public.formulation_ingredients (formulation_id, product_id, quantity)
     values (current_setting('test.v2')::uuid, '30000000-0000-0000-0000-0000000000c3', 2) $$,
  'the new version is not frozen'
);
-- Called through set_config, not in a WHERE clause, so it runs exactly once.
select set_config('test.v3', public.create_formulation_version('40000000-0000-0000-0000-0000000000c1')::text, true);
select is(
  (select version from public.formulations where id = current_setting('test.v3')::uuid),
  3,
  'versioning v1 again gives v3 (the next free number, not v1 + 1)'
);
select is(
  (select count(*) from public.formulations where code = 'F01'),
  3::bigint,
  'each call creates exactly one version'
);

-- Price with its source and supplier: one transaction.
select set_config('test.price', public.add_product_price(
  '30000000-0000-0000-0000-0000000000c3', 125.5, '2026-11-27', 'Super Test', true,
  'https://example.com/canela', 'Observación: oferta'
)::text, true);

select is(
  (select row(pp.price, pp.currency, pp.observed_on, pp.in_stock, pp.notes, s.name)::text
   from public.product_prices pp join public.suppliers s on s.id = pp.supplier_id
   where pp.id = current_setting('test.price')::uuid),
  row(125.5::numeric(12, 2), 'DOP', '2026-11-27'::date, true, 'Observación: oferta', 'Super Test')::text,
  'the price is stored in DOP with its new supplier'
);
select is(
  (select row(src.kind, src.url, src.accessed_on, src.title)::text
   from public.product_prices pp join public.sources src on src.id = pp.source_id
   where pp.id = current_setting('test.price')::uuid),
  row('commercial', 'https://example.com/canela', '2026-11-27'::date, 'Super Test: Unused Canela 100 unit')::text,
  'the page where it was seen is saved as a commercial source'
);
select lives_ok(
  $$ select public.add_product_price('30000000-0000-0000-0000-0000000000c3', 130, '2026-11-28', 'Super Test', null, null, null) $$,
  'a second price from the same supplier without a URL'
);
select is(
  (select row(count(distinct pp.supplier_id), count(pp.source_id))::text from public.product_prices pp
   where pp.product_id = '30000000-0000-0000-0000-0000000000c3'),
  row(1, 1)::text,
  'the supplier is reused by name, and no source is made without a URL'
);
select set_config('test.price2', public.add_product_price(
  '30000000-0000-0000-0000-0000000000c3', 140, '2026-11-29', p_source_url => 'https://example.com/sin-proveedor'
)::text, true);
select is(
  (select src.title from public.product_prices pp join public.sources src on src.id = pp.source_id
   where pp.id = current_setting('test.price2')::uuid),
  'Precio: Unused Canela 100 unit',
  'a price with a URL and no supplier gets a generic source title'
);
select throws_ok(
  $$ select public.add_product_price('30000000-0000-0000-0000-0000000000c3', -1, '2026-11-29', 'Otro', null,
       'https://example.com/negativo', null) $$,
  '23514', null, 'an invalid price is rejected'
);
select is(
  (select row((select count(*) from public.sources where url = 'https://example.com/negativo'),
              (select count(*) from public.suppliers where name = 'Otro'))::text),
  row(0, 0)::text,
  'a rejected price leaves neither its source nor its supplier behind'
);

-- User C2 cannot use C1's rows through the functions (RLS hides them).
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-0000000000c2","role":"authenticated"}', true);

select throws_ok(
  $$ select public.create_formulation_version('40000000-0000-0000-0000-0000000000c1') $$,
  'P0002', null, 'another user cannot version my recipe'
);
select throws_ok(
  $$ select public.add_product_price('30000000-0000-0000-0000-0000000000c3', 1, '2026-11-27', null, null, null, null) $$,
  'P0002', null, 'another user cannot price my product'
);

-- The triggers only watch their own columns: cascades and "on delete set null" still work.
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);

insert into public.ingredients (id, name) values ('60000000-0000-0000-0000-0000000000c1', 'Cacao');
update public.products set ingredient_id = '60000000-0000-0000-0000-0000000000c1'
where id = '30000000-0000-0000-0000-0000000000c1';
select lives_ok(
  $$ delete from public.ingredients where id = '60000000-0000-0000-0000-0000000000c1' $$,
  'deleting an ingredient unlinks its product in use'
);

insert into public.hypotheses (id, project_id, statement)
values ('70000000-0000-0000-0000-0000000000c1', '20000000-0000-0000-0000-0000000000c1', 'Más cacao, más amargor');
update public.experiments set hypothesis_id = '70000000-0000-0000-0000-0000000000c1'
where id = '50000000-0000-0000-0000-0000000000c1';
select lives_ok(
  $$ delete from public.hypotheses where id = '70000000-0000-0000-0000-0000000000c1' $$,
  'deleting a hypothesis unlinks its recorded experiment'
);

insert into public.research_projects (id, title) values ('20000000-0000-0000-0000-0000000000c2', 'Scratch');
insert into public.formulations (id, project_id, code)
values ('40000000-0000-0000-0000-0000000000c3', '20000000-0000-0000-0000-0000000000c2', 'X01');
insert into public.formulation_ingredients (formulation_id, product_id, quantity)
values ('40000000-0000-0000-0000-0000000000c3', '30000000-0000-0000-0000-0000000000c1', 10);
select lives_ok(
  $$ delete from public.research_projects where id = '20000000-0000-0000-0000-0000000000c2' $$,
  'deleting a project without experiments cascades through recipes that use products in use'
);

-- Deleting a recorded experiment is still the explicit way to undo it.
select lives_ok(
  $$ delete from public.experiments where id = '50000000-0000-0000-0000-0000000000c1' $$,
  'a recorded experiment can be deleted'
);

select * from finish();

rollback;
