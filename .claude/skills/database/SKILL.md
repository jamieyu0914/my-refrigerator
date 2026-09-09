---
name: database
description: Supabase (Postgres) database conventions for this project — schema design, naming, Row Level Security, and how the src/repositories/ + src/services/ data-access layers should talk to Supabase. Use whenever creating or modifying database schema/migrations, Supabase queries, or the repositories/services layers.
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

## `repositories/` + `services/` layer conventions

This is what makes the Supabase migration safe: **components and stores never talk to Supabase directly** — only `src/repositories/*.js` does, and only `src/services/*.js` may call a repository.

- One shared client: `src/services/supabaseClient.js` exports a single instance from `createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)`, plus the cross-cutting `getCurrentUserId()` session helper.
- `src/repositories/<domain>Repository.js` (e.g. `refrigeratorRepository.js` for the `foods` table) owns every `supabase.from('<table>')...` call for that table, exposing plain CRUD verbs (`getItems()`, `getItemById(id)`, `createItem(row)`, `updateItem(id, payload)`, `deleteItem(id)`). Repository functions are dumb CRUD: they take/return **raw snake_case rows** matching the table columns 1:1, with zero camelCase mapping and zero domain logic. `if (error) throw error` — never swallow or log. A repository's file/export names describe the feature (`refrigerator`), independent of what the underlying table/type/store happen to be named (`foods`/`Food`/`stores/food.js`).
- `src/services/<domain>Service.js` is the only caller of that repository. It resolves `getCurrentUserId()` when a write needs it, maps snake_case rows to camelCase JS objects shaped like `src/types/*.js` (and back before writing) via a `toX()` mapper, and calls the repository. Services import repository functions, not `supabaseClient.js`, for table access.
- Services still `throw` (not swallow) whatever the repository throws — error handling stays the calling Pinia store/component's job, per `.claude/skills/backend/SKILL.md`.
- Keep function names/signatures stable up each layer (a store calling `fetchFoods()` shouldn't need to change when the service starts delegating to a repository underneath it) — see `.claude/skills/backend/SKILL.md` for the full store↔service↔repository contract.
- Every domain currently has a repository (`refrigeratorRepository.js`, `shoppingListRepository.js`, `authRepository.js`) — new domains should get one from the start rather than having their service call `supabase`/`supabase.auth` directly.
- The `auth` domain shows the pattern for non-table concerns too: `authRepository.js` wraps the raw `supabase.auth.*` calls (`fetchSession`, `signInWithPassword`, `signOutSession`, `subscribeToAuthChanges`) plus the one `profiles` row read (`fetchProfileById`) it needs; `authService.js` composes those into `toUser()` and keeps its own exported names (`getSession`, `signIn`, `signOut`, `onAuthStateChange`) stable for `stores/auth.js`.

## Auth integration

- `services/authService.js` moves from `localStorage` demo tokens to `supabase.auth.signInWithPassword({ email, password })`, `supabase.auth.signOut()`, and `supabase.auth.getSession()` / `onAuthStateChange` for session restore on page load.
- `stores/auth.js` keeps its current public shape (`isLoggedIn`, `user`, `login()`, `logout()`) so `router/index.js` and `NavBar.vue` don't need to change when the swap happens.

## Environment variables

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` belong in a `.env` file (gitignored, never committed) — Vite exposes anything prefixed `VITE_` to client code via `import.meta.env`.
- Document required variables in a committed `.env.example` with placeholder values, kept in sync whenever a new variable is added.
