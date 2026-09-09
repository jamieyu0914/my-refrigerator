-- recipes becomes a shared cookbook (readable by every authenticated user,
-- writable only by its creator) and "favorite" becomes a real many-to-many
-- relation: favorite_recipes(user_id, recipe_id) instead of recipes.is_favorite
-- (see .claude/skills/database/SKILL.md)

-- ============================================================
-- recipes: split the single "owner does everything" policy into
-- select (open to everyone) + insert/update/delete (creator only)
-- ============================================================
drop policy "users manage own recipes" on recipes;

create policy "recipes are readable by authenticated users"
  on recipes for select
  to authenticated
  using (true);

create policy "users create own recipes"
  on recipes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users update own recipes"
  on recipes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users delete own recipes"
  on recipes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- recipe_ingredients / recipe_steps: select open to everyone (their
-- parent recipe is now public); insert/update/delete stay creator-only
-- ============================================================
drop policy "users manage own recipe ingredients" on recipe_ingredients;

create policy "recipe ingredients are readable by authenticated users"
  on recipe_ingredients for select
  to authenticated
  using (true);

create policy "users create own recipe ingredients"
  on recipe_ingredients for insert
  to authenticated
  with check (exists (
    select 1 from recipes
    where recipes.id = recipe_ingredients.recipe_id and recipes.user_id = auth.uid()
  ));

create policy "users update own recipe ingredients"
  on recipe_ingredients for update
  to authenticated
  using (exists (
    select 1 from recipes
    where recipes.id = recipe_ingredients.recipe_id and recipes.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from recipes
    where recipes.id = recipe_ingredients.recipe_id and recipes.user_id = auth.uid()
  ));

create policy "users delete own recipe ingredients"
  on recipe_ingredients for delete
  to authenticated
  using (exists (
    select 1 from recipes
    where recipes.id = recipe_ingredients.recipe_id and recipes.user_id = auth.uid()
  ));

drop policy "users manage own recipe steps" on recipe_steps;

create policy "recipe steps are readable by authenticated users"
  on recipe_steps for select
  to authenticated
  using (true);

create policy "users create own recipe steps"
  on recipe_steps for insert
  to authenticated
  with check (exists (
    select 1 from recipes
    where recipes.id = recipe_steps.recipe_id and recipes.user_id = auth.uid()
  ));

create policy "users update own recipe steps"
  on recipe_steps for update
  to authenticated
  using (exists (
    select 1 from recipes
    where recipes.id = recipe_steps.recipe_id and recipes.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from recipes
    where recipes.id = recipe_steps.recipe_id and recipes.user_id = auth.uid()
  ));

create policy "users delete own recipe steps"
  on recipe_steps for delete
  to authenticated
  using (exists (
    select 1 from recipes
    where recipes.id = recipe_steps.recipe_id and recipes.user_id = auth.uid()
  ));

-- ============================================================
-- favorite_recipes: User <-> Recipe many-to-many relation
-- ============================================================
create table favorite_recipes (
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id uuid not null references recipes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create index favorite_recipes_recipe_idx on favorite_recipes (recipe_id);

alter table favorite_recipes enable row level security;

create policy "users manage own favorite recipes"
  on favorite_recipes for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- migrate existing is_favorite=true rows into favorite_recipes,
-- then drop the now-redundant column
-- ============================================================
insert into favorite_recipes (user_id, recipe_id)
select user_id, id from recipes where is_favorite = true;

alter table recipes drop column is_favorite;
