---
name: data
description: Domain data-model conventions for this project — the shape of the JS objects passed around the app (`src/types/` JSDoc typedefs), the row↔object `toX()` mappers in services, fixed value sets (categories, difficulty) and where their single source of truth lives, date/timestamp/null handling, derived fields (expiry status, isFavorite/isOwn), and seed/test data. Use whenever adding or changing a field on a domain type, adding a new enum-like value set, writing a `toX()` mapper or partial-update payload, handling dates, or adding seed rows/test fixtures. For schema/RLS/repository rules see `.claude/skills/database/SKILL.md`; for store/service error flow see `.claude/skills/backend/SKILL.md`.
---

# Data Model Guide

Conventions for **what the data looks like** as it moves through the app — not how it's stored (that's the `database` skill) or how errors flow (that's the `backend` skill). The goal: every layer agrees on one shape per domain, one source of truth per value set, and one rule per data type (dates, nulls, ids).

## One shape per domain: `src/types/`

- Every domain object that crosses a layer boundary (service → store → component) has a JSDoc `@typedef` in `src/types/<domain>.js` (`Food`, `ShoppingItem`, `Recipe`, `RecipeIngredient`, `RecipeStep`, `User`, `RecognizedFoodItem`). Files contain only the typedef plus `export {}`.
- Properties are `camelCase`; the matching DB columns are `snake_case`. The typedef describes the **mapped object**, never the raw row.
- Nullable fields are typed `{T|null}` (`expiryDate: string|null`, `unit: string|null`). Fields that only exist on some reads are typed `{T|undefined}` (`Recipe.ingredients` is only present on a detail fetch). Optional/display-only fields use `[name]` (`[confidence]`).
- Add a one-line `- comment` on any property whose meaning isn't obvious from its name — especially ids that are *not* DB ids (`tempId`) and fields that must never drive logic (`confidence`).
- **Adding a field** touches, in order: the migration → the typedef → the service's `toX()` mapper and write payloads → the component(s) that render/edit it → the service spec's row fixture. Missing any one of these is the most common data bug in this repo.

## Mappers: `toX(row)` in services

The service is the only place rows become domain objects (see `database` skill). Inside it:

- One private `toX(row)` per typedef (`toFood`, `toShoppingItem`, `toRecipe`, `toIngredient`, `toStep`). It lists **every** property of the typedef explicitly — no spreading `...row`, so a new DB column never leaks into the app unmapped and a removed one fails loudly.
- Renames between DB and app happen only here: `category_code → category`, `expiry_date → expiryDate`, `image_url → imageUrl`, etc. If the app name and column name diverge, the typedef wins for the app side.
- Derived fields are computed in the mapper from the row, not stored: `isFavorite` from the embedded `favorite_recipes` rows, `isOwn` from `row.user_id === userId`. Pass extra context (like `userId`) as a second argument, as `toRecipe(row, userId)` does.
- Child collections are sorted in the mapper by `sort_order` (`[...row.recipe_steps].sort(...)`), copying first so the raw row isn't mutated. Order on write is the array index (`sort_order: index`).
- **Partial updates** build the payload with `'field' in updates` guards, one line per field, mapping name and normalizing in the same line:
  ```js
  const payload = {}
  if ('category' in updates) payload.category_code = updates.category
  if ('expiryDate' in updates) payload.expiry_date = updates.expiryDate || null
  ```
  Never write `undefined` into a payload, and never send fields the caller didn't pass.

## Fixed value sets (categories, difficulty, …)

- A value set used in more than one file lives in `src/utils/constants.js` as an exported `UPPER_SNAKE` array (`CATEGORIES`). Components render `<option v-for>` from it and default forms to `CATEGORIES[0]`; services validate against it. Never retype the literal list in a component.
- The stored value **is** the display value for these sets (`'蔬果'`, `'簡單'`) — there's no separate code/label mapping in the app today. Keep it that way unless a set genuinely needs translation.
- Each set also exists outside the app and must be kept in sync by hand in the same change:
  | Value set | `src/utils/constants.js` | Database | Elsewhere |
  |---|---|---|---|
  | Categories | `CATEGORIES` | `categories` table seed rows (FK from `foods`, `shopping_items`, `promotions`, `promotion_products`) | `supabase/functions/analyze-food-image/index.ts` `CATEGORIES` + `aiVisionService.js` `EMOJI_BY_CATEGORY` + `scripts/pxbox/mapProduct.js` `toCategoryCode()` |
  | Store source (特價食材) | `STORE_SOURCES` | `check (store_source in ('全聯全電商','大全聯'))` on `promotion_products` | `scripts/pxbox/mapProduct.js` `toStoreSource()` |
  | Recipe difficulty | — (currently local `DIFFICULTIES` in `RecipeForm.vue`) | `check (difficulty in ('簡單','普通','困難'))` on `recipes` | — |
  When a second file needs `DIFFICULTIES`, move it to `constants.js` first.
- Adding a value = a new migration inserting the row / altering the check constraint, plus the constant, plus any per-value lookup map (emoji, colors). Removing or renaming a value needs a migration that rewrites existing rows first — FKs will reject the delete otherwise.
- Untrusted input (AI output, URL query params) is coerced to the set, not rejected: unknown category → `'其他'`, as `toRecognizedItem` does.

## Dates and timestamps

Two kinds, never mixed:

| Kind | DB type | App value | Examples |
|---|---|---|---|
| Calendar date (no time, no zone) | `date` | `'YYYY-MM-DD'` string or `null` | `expiryDate`, `validFrom`, `validUntil` |
| Moment in time | `timestamptz default now()` | ISO-8601 string from Supabase | `addedAt`, `createdAt`, `updatedAt` |

- Pass both through as **strings**; don't convert to `Date` in mappers or stores. `<input type="date">` already produces/consumes `'YYYY-MM-DD'`.
- Timestamps are set by the DB (`default now()`, `set_updated_at()` trigger) — never send `created_at`/`updated_at`/`added_at` from the client.
- When comparing a calendar date to "today", parse it as a **local** date (`new Date(y, m - 1, d)` from the split string), not `new Date('YYYY-MM-DD')`, which parses as UTC midnight and is off by a day in UTC+8. Put date math in `src/utils/` (like `expiry.js`) with a spec, never inline in a component.

## Nulls, empty strings, numbers

- Nullable columns get `null`, never `''`. The service normalizes optional strings on write with `value || null` (`unit`, `imageUrl`, `amount`, `expiryDate`); the component has already trimmed them (see `backend` skill).
- Numbers arrive from forms as strings — the component coerces (`Number(form.quantity) || 1`); the typedef says `number`, so the service can trust it. `quantity` is an integer `>= 0` (DB check).
- Arrays default to empty, not null: `tags` is `text[] default '{}'`, so `recipe.tags` is always an array and can be `.some()`-ed without a guard.

## Ids

- Persisted objects use the DB's `uuid` (`gen_random_uuid()`); the client never invents ids for rows it's about to insert — it uses the id from the returned row.
- Client-only drafts (e.g. AI recognition results before confirmation, see `ai-vision` skill) use `crypto.randomUUID()` in a field named `tempId`, never `id`, so a draft can't be mistaken for a saved row.

## Derived data

- Anything computable from stored fields is computed, not stored: expiry status (`getExpiryStatus(expiryDate)` → `'expired' | 'soon' | 'ok' | 'none'`), search matches (`matchesRecipeSearch`), `isOwn`.
- Pure, reusable derivations live in `src/utils/<name>.js` with a matching `src/utils/__tests__/<name>.spec.js`; thresholds are named constants at the top of the file (`SOON_DAYS = 3`).
- Per-row derivations that need the raw row (embedded relations, `user_id`) belong in the service mapper instead.

## Seed and test data

- Shared reference/sample data goes in a timestamped migration (`supabase/migrations/<ts>_seed_<what>.sql`), not app code, and must satisfy the same FKs/checks as user data (valid `category_code`, `difficulty`).
- Service specs mock the repository and feed it **snake_case rows exactly as Supabase returns them**, then assert the camelCase output — that's what actually tests the mapper. Include `null` optional columns in at least one fixture.
- Store/component specs use already-mapped camelCase objects matching the typedef; never hand a component a raw row.
- Fixture values use real members of the value sets (`'蔬果'`, not `'veg'`) and `'YYYY-MM-DD'` / ISO strings for dates.
