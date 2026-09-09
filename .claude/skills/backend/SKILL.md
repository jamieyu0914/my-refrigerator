---
name: backend
description: Business-logic conventions between the UI and the database — Pinia store/service contracts, error propagation, and input validation. Use whenever adding or editing a store action, wiring a store to a service function, or handling errors/validation for a form submission. For raw schema/RLS/Supabase query conventions see `.claude/skills/database/SKILL.md`; for component/router structure see `.claude/skills/frontend/SKILL.md`.
---

# Backend / Data Flow Guide

Conventions for the logic layer that sits between views and `src/services/` — i.e. Pinia store actions, and how components call them. This is not about SQL/RLS (see the `database` skill) or component structure (see the `frontend` skill); it's about what happens to data and errors as they move view → store → service → Supabase and back.

## Store ↔ service contract

- A store action is a thin wrapper: call the matching service function, then reconcile local state from its return value. Never refetch the whole list after a mutation just to stay in sync — update `foods.value` in place:
  ```js
  async function addFood(payload) {
    const food = await insertFood(payload)
    foods.value.push(food)
  }

  async function updateFood(id, updates) {
    const updated = await updateFoodRow(id, updates)
    const index = foods.value.findIndex((f) => f.id === id)
    if (index !== -1) foods.value[index] = updated
  }
  ```
- When a store's own action name would collide with the service export (`updateFood` action vs. `updateFood` service function), alias the *import*, not the service export: `import { updateFood as updateFoodRow } from '../services/foodService'`. Keep service function names stable (see `database` skill) — rename on the store side only.
- Stores pass data through untouched. Field-name/casing translation (`category` ↔ `category_code`, etc.) happens only inside the service, never in a store action.
- A store never imports `supabaseClient.js` or any `services/*` module other than its own matching one (`stores/food.js` → `services/foodService.js` only).

## Service ↔ repository contract

When a domain has a `src/repositories/<domain>Repository.js` (see `.claude/skills/database/SKILL.md`), the same shape rule as store↔service applies one layer down:

- The repository is dumb: one function per query/mutation, raw snake_case rows in and out, no mapping, no business logic. It's the only thing that imports `supabaseClient.js` for that table.
- The service is the translator: it resolves cross-cutting concerns the repository shouldn't know about (`getCurrentUserId()` for ownership), maps rows to/from the camelCase shape in `src/types/`, and is the only caller of that repository.
- Naming mirrors the store↔service pattern: keep the service's exported function names stable (`fetchFoods`, `insertFood`, ...) regardless of what the repository underneath is called (`refrigeratorRepository.js`'s `getItems`, `createItem`, ...) — a caller two layers up (the store) should never need to change when a service starts delegating to a new repository.
- Every domain has this third layer now (`refrigeratorRepository.js`, `shoppingListRepository.js`, `authRepository.js`) — add one for any new domain too, rather than letting its service call `supabase` directly.

## Error propagation

- Services throw (`throw error`); stores do **not** wrap actions in `try/catch` — let rejections propagate untouched. A store action either resolves with updated state or rejects; it never swallows an error or returns `null`/`false` on failure.
- Only the component that triggered the action (a submit handler, a delete button handler) catches the error, right at the call site, and turns it into user-facing state:
  ```js
  errorMessage.value = ''
  isSubmitting.value = true
  try {
    await auth.login(email.value.trim(), password.value)
    router.push(route.query.redirect || { name: 'home' })
  } catch {
    errorMessage.value = '登入失敗，請確認 Email 或密碼是否正確。'
  } finally {
    isSubmitting.value = false
  }
  ```
- Always reset the loading/submitting flag in `finally`, so a rejected action never leaves a button stuck disabled.
- Don't use `alert()`/`console.error` for user-facing failures — bind an `errorMessage` ref and render it in the template (see `Login.vue`).

## Validation

- Validate in the component, before calling the store — services and stores trust their input and do not re-validate:
  - Required fields: guard-clause `return` at the top of the submit handler (`if (!form.name.trim()) return`), not a thrown error.
  - Strings: `.trim()` before sending to the store/service.
  - Numbers: coerce with a fallback default, e.g. `Number(form.quantity) || 1`.
  - Optional dates/empty strings: normalize `''` to `null` before it reaches the service (`form.expiryDate || null`) — never persist an empty string where the column is nullable.
- If a rule needs to be shared across more than one form, put it in `src/utils/` as a plain function and call it from each component — don't duplicate the guard clause, and don't push shared validation down into a service (services stay dumb pass-throughs to Supabase).

## Loading state

- Views track their own `isLoading` (initial fetch) and `isSubmitting` (in-flight mutation) as local `ref`s — this is UI state, not store state, and doesn't belong in Pinia.
- Set `isLoading.value = true` synchronously before the `await` in `onMounted`, flip it off after the awaited load resolves (success or failure via `finally` if the load can error).
