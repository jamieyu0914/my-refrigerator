---
name: database
description: Supabase (Postgres) database conventions for this project — schema design, naming, Row Level Security, and how the src/services/ data-access layer should talk to Supabase. Use whenever creating or modifying database schema/migrations, Supabase queries, or the services/ layer.
---

# Database Development Guide

Conventions for the database layer of this project. Follow these whenever creating or modifying schema, migrations, or `src/services/` code that talks to the database.

## Tech Stack

- **Database**: Supabase (managed Postgres)
- **Client**: `@supabase/supabase-js`
- **Auth**: Supabase Auth (email/password) — will replace the current localStorage-based demo login in `stores/auth.js`

## Schema

Tables mirror the domain types already defined in `src/types/` (`food.js`, `recipe.js`, `shoppingItem.js`, `user.js`). Current v1 migration: `supabase/migrations/20260905000000_init_schema.sql`.

```
auth.users        # managed by Supabase Auth
profiles          # 1:1 with auth.users — id, name, created_at (auto-created via on_auth_user_created trigger)
categories        # shared lookup used by foods & promotions — code (PK), label, sort_order
foods             # id, user_id, name, category_code (FK -> categories), quantity, expiry_date, added_at
shopping_items    # id, user_id, name, quantity, checked, added_at
recipes           # id, user_id, title, ingredients (jsonb), instructions, image_url, tags (text[]), is_favorite, created_at
promotions        # id, user_id, name, category_code (FK -> categories), original_price, discount_price, store, valid_from, valid_until, image_url, created_at
```

- **Naming**: SQL identifiers use `snake_case` (`expiry_date`, `user_id`, `added_at`). The `src/types/*.js` shapes are `camelCase` — converting between the two is `services/`'s job, never the store's or component's.
- **Primary keys**: `id uuid primary key default gen_random_uuid()`, matching the `crypto.randomUUID()` ids the Pinia stores currently generate client-side. `categories` is the one exception — it uses its natural key (`code text primary key`, e.g. `'蔬果'`) since the value set is small and fixed.
- **Ownership + RLS**: every per-user table (`foods`, `shopping_items`, `recipes`, `promotions`, `profiles`) has `user_id`/`id` tied to `auth.users` with RLS restricting all operations to `auth.uid()`. `recipes` is private per user — there is no cross-user sharing/favoriting table; "favorite" is just `recipes.is_favorite`. `categories` is the one shared/reference table: readable by all authenticated users, writable only by service role.
- **Timestamps**: use `timestamptz`, default `now()`, for any `added_at`/`created_at` column.

## `services/` layer conventions

This is what makes the Supabase migration safe: **components and stores never talk to Supabase directly** — only `src/services/*.js` does.

- One shared client: `src/services/supabaseClient.js` exports a single instance from `createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)`.
- Each domain service (`foodService.js`, `shoppingListService.js`, `recipeService.js`, `authService.js`) is the *only* module that imports `supabaseClient.js` for that table.
- Service functions return plain camelCase JS objects shaped like `src/types/*.js` — map snake_case rows to camelCase inside the service before returning, and back to snake_case before writing.
- On a Supabase error, `throw error` (or `throw new Error(error.message)`) rather than swallowing it or logging inside the service — let the calling Pinia store/component decide how to surface it to the user.
- Keep function names/signatures stable across the localStorage → Supabase swap (e.g. `loadFoods()` / `saveFoods()` stay named the same even once they call Supabase instead of `localStorage`), so migrating a store is a `services/`-only change — see `.claude/skills/frontend/SKILL.md` for how stores depend on services.

## Auth integration

- `services/authService.js` moves from `localStorage` demo tokens to `supabase.auth.signInWithPassword({ email, password })`, `supabase.auth.signOut()`, and `supabase.auth.getSession()` / `onAuthStateChange` for session restore on page load.
- `stores/auth.js` keeps its current public shape (`isLoggedIn`, `user`, `login()`, `logout()`) so `router/index.js` and `NavBar.vue` don't need to change when the swap happens.

## Environment variables

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` belong in a `.env` file (gitignored, never committed) — Vite exposes anything prefixed `VITE_` to client code via `import.meta.env`.
- Document required variables in a committed `.env.example` with placeholder values, kept in sync whenever a new variable is added.
