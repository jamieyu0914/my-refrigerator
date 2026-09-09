-- recipe details: cook_time_minutes/difficulty/description/updated_at on recipes,
-- plus recipe_ingredients/recipe_steps child tables (recipes.ingredients jsonb array
-- and recipes.instructions text become normalized one-to-many tables)
-- (see .claude/skills/database/SKILL.md)

alter table recipes add column cook_time_minutes integer
  check (cook_time_minutes is null or cook_time_minutes >= 0);
alter table recipes add column difficulty text
  check (difficulty is null or difficulty in ('簡單', '普通', '困難'));
alter table recipes add column description text;
alter table recipes add column updated_at timestamptz not null default now();

create trigger recipes_set_updated_at
  before update on recipes
  for each row execute function public.set_updated_at();

-- ============================================================
-- recipe_ingredients / recipe_steps: 一對多子表，權限跟著 recipes.user_id 走
-- ============================================================
create table recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes (id) on delete cascade,
  name text not null,
  amount text,
  sort_order integer not null default 0
);

create index recipe_ingredients_recipe_sort_idx on recipe_ingredients (recipe_id, sort_order);

alter table recipe_ingredients enable row level security;

create policy "users manage own recipe ingredients"
  on recipe_ingredients for all
  to authenticated
  using (exists (
    select 1 from recipes
    where recipes.id = recipe_ingredients.recipe_id and recipes.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from recipes
    where recipes.id = recipe_ingredients.recipe_id and recipes.user_id = auth.uid()
  ));

create table recipe_steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes (id) on delete cascade,
  description text not null,
  sort_order integer not null default 0
);

create index recipe_steps_recipe_sort_idx on recipe_steps (recipe_id, sort_order);

alter table recipe_steps enable row level security;

create policy "users manage own recipe steps"
  on recipe_steps for all
  to authenticated
  using (exists (
    select 1 from recipes
    where recipes.id = recipe_steps.recipe_id and recipes.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from recipes
    where recipes.id = recipe_steps.recipe_id and recipes.user_id = auth.uid()
  ));

-- ============================================================
-- 搬移既有資料到子表，再拿掉舊欄位
-- ============================================================
insert into recipe_ingredients (recipe_id, name, sort_order)
select r.id, t.value, (t.ordinality - 1)::integer
from recipes r
cross join lateral jsonb_array_elements_text(coalesce(r.ingredients, '[]'::jsonb))
  with ordinality as t(value, ordinality);

insert into recipe_steps (recipe_id, description, sort_order)
select r.id, r.instructions, 0
from recipes r
where r.instructions is not null and r.instructions <> '';

alter table recipes drop column ingredients;
alter table recipes drop column instructions;
