-- A tested formulation freezes its composition (which products, how much), not its annotations:
-- ingredient notes stay editable so exception notes can be added or normalized later.
-- create or replace keeps the function's grants (execute revoked from every API role).
create or replace function public.lock_tested_formulation_ingredients()
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

  -- An update that leaves the composition as it was (e.g. only notes) is always allowed.
  if tg_op = 'UPDATE'
     and (new.formulation_id, new.product_id, new.quantity)
         is not distinct from (old.formulation_id, old.product_id, old.quantity) then
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
