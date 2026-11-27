-- Fixes from the first migration review.

-- Default privileges (local, and hosted when auto-grants are on) also give EXECUTE
-- to authenticated and service_role. keepalive is for anon only; the trigger
-- function is for no API role.
revoke execute on function public.keepalive() from authenticated, service_role;
revoke execute on function public.lock_tested_formulation_ingredients() from service_role;

-- A nutrient total is null when any ingredient lacks that value, so a partial sum
-- never looks complete. ingredients_without_nutrition still counts missing rows.
create or replace view public.v_formulation_nutrition with (security_invoker = true) as
select
  f.id as formulation_id,
  f.project_id,
  f.code,
  f.version,
  f.servings,
  case when count(n.energy_kcal) = count(*)
    then sum(fi.quantity / n.basis_quantity * n.energy_kcal) / coalesce(f.servings, 1) end as energy_kcal,
  case when count(n.fat_g) = count(*)
    then sum(fi.quantity / n.basis_quantity * n.fat_g) / coalesce(f.servings, 1) end as fat_g,
  case when count(n.saturated_fat_g) = count(*)
    then sum(fi.quantity / n.basis_quantity * n.saturated_fat_g) / coalesce(f.servings, 1) end as saturated_fat_g,
  case when count(n.carbohydrates_g) = count(*)
    then sum(fi.quantity / n.basis_quantity * n.carbohydrates_g) / coalesce(f.servings, 1) end as carbohydrates_g,
  case when count(n.sugars_g) = count(*)
    then sum(fi.quantity / n.basis_quantity * n.sugars_g) / coalesce(f.servings, 1) end as sugars_g,
  case when count(n.fiber_g) = count(*)
    then sum(fi.quantity / n.basis_quantity * n.fiber_g) / coalesce(f.servings, 1) end as fiber_g,
  case when count(n.protein_g) = count(*)
    then sum(fi.quantity / n.basis_quantity * n.protein_g) / coalesce(f.servings, 1) end as protein_g,
  case when count(n.sodium_mg) = count(*)
    then sum(fi.quantity / n.basis_quantity * n.sodium_mg) / coalesce(f.servings, 1) end as sodium_mg,
  count(*) filter (where n.product_id is null) as ingredients_without_nutrition
from public.formulations f
join public.formulation_ingredients fi on fi.formulation_id = f.id
left join public.product_nutrition n on n.product_id = fi.product_id
group by f.id;
