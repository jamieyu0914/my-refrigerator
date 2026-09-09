-- shopping_items v2: rename checked/added_at, add unit/category_code/updated_at
-- (see .claude/skills/database/SKILL.md)

alter table shopping_items rename column checked to purchased;
alter table shopping_items rename column added_at to created_at;

alter table shopping_items add column unit text;

alter table shopping_items add column category_code text references categories (code) default '其他';
update shopping_items set category_code = '其他' where category_code is null;
alter table shopping_items alter column category_code set not null;
alter table shopping_items alter column category_code drop default;

alter table shopping_items add column updated_at timestamptz not null default now();

alter index shopping_items_user_checked_idx rename to shopping_items_user_purchased_idx;
create index shopping_items_user_category_idx on shopping_items (user_id, category_code);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger shopping_items_set_updated_at
  before update on shopping_items
  for each row execute function public.set_updated_at();
