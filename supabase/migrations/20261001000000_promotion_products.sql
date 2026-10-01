-- 特價食材: products synced daily from 全聯全電商 (pxbox.es.pxmart.com.tw) by
-- scripts/sync-pxbox.mjs (GitHub Actions, service role), plus a new 海鮮 category.
-- Shared reference data like `categories`: readable by every authenticated user,
-- writable only by the service role (no insert/update/delete policies).
-- (see .claude/skills/database/SKILL.md and .claude/skills/data/SKILL.md)

-- ============================================================
-- categories: add 海鮮 right after 肉類
-- ============================================================
update categories set sort_order = sort_order + 1 where sort_order >= 3;
insert into categories (code, label, sort_order) values ('海鮮', '海鮮', 3);

-- ============================================================
-- promotion_products: latest snapshot of every synced product
-- ============================================================
create table promotion_products (
  id bigint primary key, -- 全聯全電商 product id, not generated here
  name text not null,
  category_code text not null references categories (code),
  source_category text not null, -- the site's own category path, e.g. '冷藏冷凍>海鮮類'
  store_source text not null check (store_source in ('全聯全電商', '大全聯')),
  sale_price integer not null check (sale_price >= 0),
  market_price integer check (market_price is null or market_price >= 0),
  is_discount_price boolean not null default false,
  sale_price_tag text,
  image_url text,
  is_sold_out boolean not null default false,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null
);

create index promotion_products_category_idx on promotion_products (category_code);
create index promotion_products_store_source_idx on promotion_products (store_source);

alter table promotion_products enable row level security;

create policy "promotion products are readable by authenticated users"
  on promotion_products for select
  to authenticated
  using (true);

-- ============================================================
-- promotion_price_changes: one row per product per day its sale_price changed
-- (change-only, not a daily snapshot, to keep the table small)
-- ============================================================
create table promotion_price_changes (
  product_id bigint not null references promotion_products (id) on delete cascade,
  observed_on date not null, -- Asia/Taipei calendar date
  sale_price integer not null check (sale_price >= 0),
  market_price integer check (market_price is null or market_price >= 0),
  primary key (product_id, observed_on)
);

alter table promotion_price_changes enable row level security;

create policy "promotion price changes are readable by authenticated users"
  on promotion_price_changes for select
  to authenticated
  using (true);

-- ============================================================
-- promotion_sync_runs: one row per sync attempt
-- ============================================================
create table promotion_sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'success', 'failed')),
  product_count integer,
  error text
);

create index promotion_sync_runs_status_started_idx on promotion_sync_runs (status, started_at desc);

alter table promotion_sync_runs enable row level security;

create policy "promotion sync runs are readable by authenticated users"
  on promotion_sync_runs for select
  to authenticated
  using (true);

-- ============================================================
-- promotion_deals: products from the last successful sync that earn at least one badge
--   price_drop     - current price started within the last 30 days and is below the lowest
--                    price, or >= 10% below the time-weighted average price, of the 30 days
--                    before it started. reference_price is that average (only set with this
--                    badge), not the low: the average is above the current price under either
--                    rule, the low isn't when only the average rule fired
--   discount_price - the site's own 折後價 flag
--   deep_discount  - sale_price at least 30% below market_price (the strikethrough price)
-- security_invoker so the tables' RLS applies to whoever queries the view.
-- ============================================================
create view promotion_deals
with (security_invoker = true) as
with latest_change as (
  select distinct on (product_id) product_id, observed_on as started_on
  from promotion_price_changes
  order by product_id, observed_on desc
),
change_intervals as (
  select
    product_id,
    observed_on,
    sale_price,
    lead(observed_on) over (partition by product_id order by observed_on) as next_observed_on
  from promotion_price_changes
),
reference_prices as (
  select
    c.product_id,
    min(c.sale_price) as min_price,
    sum(c.sale_price * (least(c.next_observed_on, l.started_on) - greatest(c.observed_on, l.started_on - 30)))::numeric
      / nullif(sum(least(c.next_observed_on, l.started_on) - greatest(c.observed_on, l.started_on - 30)), 0)
      as avg_price
  from change_intervals c
  join latest_change l on l.product_id = c.product_id
  where c.observed_on < l.started_on
    and c.next_observed_on > l.started_on - 30
  group by c.product_id
),
last_sync as (
  select max(started_at) as started_at
  from promotion_sync_runs
  where status = 'success'
),
scored as (
  select
    p.*,
    case
      when p.market_price > 0 and p.sale_price < p.market_price
        then round(1 - p.sale_price::numeric / p.market_price, 4)
    end as discount_rate,
    coalesce(
      l.started_on >= (now() at time zone 'Asia/Taipei')::date - 30
        and (p.sale_price < r.min_price or p.sale_price <= r.avg_price * 0.9),
      false
    ) as is_price_drop,
    round(r.avg_price)::integer as reference_price
  from promotion_products p
  cross join last_sync s
  left join latest_change l on l.product_id = p.id
  left join reference_prices r on r.product_id = p.id
  where p.last_seen_at >= s.started_at
    and not p.is_sold_out
),
badged as (
  select
    scored.*,
    coalesce(discount_rate >= 0.3, false) as is_deep_discount
  from scored
)
select
  id,
  name,
  category_code,
  source_category,
  store_source,
  sale_price,
  market_price,
  discount_rate,
  case when is_price_drop then reference_price end as reference_price,
  is_price_drop,
  is_discount_price,
  is_deep_discount,
  case
    when is_price_drop then 1
    when is_discount_price then 2
    else 3
  end as deal_rank,
  image_url,
  last_seen_at
from badged
where is_price_drop or is_discount_price or is_deep_discount;
