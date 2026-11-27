-- Domain rules move from the app into the database, so no write path can skip them
-- (AGENTS.md, "Forma de trabajar": one place per rule; illegal states impossible).
-- Tests: supabase/tests/domain_rules.sql. No new tables: existing grants and RLS apply.

-- ---------------------------------------------------------------------------
-- Recorded experiments (completed or failed) are history: they freeze their recipe, so they
-- never go back to planned/cancelled nor move to another recipe. Deleting stays the explicit undo.
-- ---------------------------------------------------------------------------

create function public.keep_recorded_experiments_recorded()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.status in ('completed', 'failed')
     and (new.status not in ('completed', 'failed') or new.formulation_id <> old.formulation_id) then
    raise exception 'a recorded experiment cannot go back to planned or cancelled, nor change recipe; delete it instead'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function public.keep_recorded_experiments_recorded() from public, anon, authenticated, service_role;

create trigger keep_recorded_experiments_recorded
before update of status, formulation_id on public.experiments
for each row execute function public.keep_recorded_experiments_recorded();

-- ---------------------------------------------------------------------------
-- A product with prices or in recipes keeps its package size and unit: prices are per package
-- and recipe quantities are in its unit, so changing either would rewrite history.
-- ---------------------------------------------------------------------------

create function public.lock_used_product_presentation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (new.package_size, new.unit) is distinct from (old.package_size, old.unit)
     and (exists (select 1 from public.product_prices where product_id = old.id)
          or exists (select 1 from public.formulation_ingredients where product_id = old.id)) then
    raise exception 'product has prices or is in recipes; create a new product for another presentation'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function public.lock_used_product_presentation() from public, anon, authenticated, service_role;

create trigger lock_used_product_presentation
before update of package_size, unit on public.products
for each row execute function public.lock_used_product_presentation();

-- ---------------------------------------------------------------------------
-- shortcut: prices are DOP only because the cost views add amounts without grouping by currency.
-- To allow another currency, drop this constraint in the same migration that groups the views.
-- ---------------------------------------------------------------------------

alter table public.product_prices
  add constraint product_prices_currency_dop check (currency = 'DOP');

-- ---------------------------------------------------------------------------
-- Multi-step operations, each in one transaction (a failure halfway leaves nothing behind).
-- security invoker: they run with the caller's RLS, so a user only reaches their own rows.
-- ---------------------------------------------------------------------------

-- Copies a recipe and its composition into the next free version of its code, as a draft.
create function public.create_formulation_version(source_formulation_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  source public.formulations;
  new_id uuid;
begin
  select * into source from public.formulations where id = source_formulation_id;
  if not found then
    raise exception 'formulation not found' using errcode = 'no_data_found';
  end if;

  insert into public.formulations
    (project_id, code, version, parent_id, name, status, servings, serving_size, serving_unit, instructions, notes)
  select source.project_id, source.code, max(f.version) + 1, source.id, source.name, 'draft',
         source.servings, source.serving_size, source.serving_unit, source.instructions, source.notes
  from public.formulations f
  where f.project_id = source.project_id and f.code = source.code
  returning id into new_id;

  insert into public.formulation_ingredients (formulation_id, product_id, quantity, notes)
  select new_id, fi.product_id, fi.quantity, fi.notes
  from public.formulation_ingredients fi
  where fi.formulation_id = source.id;

  return new_id;
end;
$$;

-- Records a price; the supplier is found or created by name, and the page where the price was
-- seen (if any) is saved as a 'commercial' source, as the research imports do.
create function public.add_product_price(
  p_product_id uuid,
  p_price numeric,
  p_observed_on date,
  p_supplier text default null,
  p_in_stock boolean default null,
  p_source_url text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  product public.products;
  supplier_id uuid;
  source_id uuid;
  price_id uuid;
begin
  select * into product from public.products where id = p_product_id;
  if not found then
    raise exception 'product not found' using errcode = 'no_data_found';
  end if;

  if p_supplier is not null then
    insert into public.suppliers (name) values (p_supplier)
    on conflict (owner_id, name) do update set name = excluded.name
    returning id into supplier_id;
  end if;

  if p_source_url is not null then
    insert into public.sources (kind, title, url, accessed_on)
    values (
      'commercial',
      coalesce(p_supplier, 'Precio') || ': '
        || concat_ws(' ', product.brand, product.name, trim_scale(product.package_size)::text || ' ' || product.unit),
      p_source_url,
      p_observed_on
    )
    returning id into source_id;
  end if;

  insert into public.product_prices (product_id, supplier_id, price, observed_on, in_stock, source_id, notes)
  values (p_product_id, supplier_id, p_price, p_observed_on, p_in_stock, source_id, p_notes)
  returning id into price_id;

  return price_id;
end;
$$;

revoke execute on function public.create_formulation_version(uuid) from public, anon, service_role;
grant execute on function public.create_formulation_version(uuid) to authenticated;

revoke execute on function public.add_product_price(uuid, numeric, date, text, boolean, text, text)
  from public, anon, service_role;
grant execute on function public.add_product_price(uuid, numeric, date, text, boolean, text, text) to authenticated;
