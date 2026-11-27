-- Explicit portion size: "servings" says how many portions a batch makes,
-- serving_size/serving_unit say how big each portion is (e.g. 1 serving of 250 ml).
-- Existing table grants cover the new columns; v_research_context picks them up via to_jsonb(f).
alter table public.formulations
  add column serving_size numeric check (serving_size > 0),
  add column serving_unit text check (serving_unit in ('g', 'ml', 'unit')),
  add constraint formulations_serving_size_has_unit check ((serving_size is null) = (serving_unit is null));
