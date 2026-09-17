---
name: ai-vision
description: Conventions for AI-powered image recognition features (e.g. scanning a fridge/receipt photo to detect food items) — the fixed input→analysis→structured-output→user-confirmation→write pipeline, and the hard rule that AI output must never be written to Supabase without an explicit user confirmation step. Use whenever adding or editing any feature that sends an image to an AI vision model and turns the result into data. For store/service error handling see `.claude/skills/backend/SKILL.md`; for Repository/Service/Supabase conventions see `.claude/skills/database/SKILL.md`.
---

# AI Vision Feature Guide

Conventions for any feature where an image is sent to an AI vision model and the result becomes data in this app (e.g. "掃描冰箱照片自動辨識食材"). This does not replace the `feature`/`backend`/`database` skills — it adds one non-negotiable rule on top of them: **AI output is a draft, never a write**.

## Core principle

AI Vision is positioned as **「協助輸入資料的助手」(an assistant that helps input data)** — not **「永遠正確的資料來源」(an always-correct source of truth)**. Concretely:

- Image recognition results are **suggestions**, always shown to the user for review before anything is persisted.
- The user can accept, edit, or discard each suggested item individually.
- No code path may go from "AI recognized this" straight to `supabase.from('foods').insert(...)` without a user click in between. If you find yourself wiring the vision result directly into `foodService.insertFood`/`refrigeratorRepository.createItem` without a confirmation UI in front of it, stop — that violates this skill.

## Fixed pipeline

Every AI Vision feature follows this exact sequence — don't collapse or reorder steps:

```
圖片輸入 (image input)
   ↓
AI Vision 分析 (send to vision model)
   ↓
辨識食材 (raw recognition result)
   ↓
結構化輸出 (normalize into RecognizedFoodItem[])
   ↓
使用者確認 (user reviews/edits/deselects — nothing persisted yet)
   ↓
寫入冰箱 (only now: write selected items to Supabase via the existing food layer)
```

The boundary between "結構化輸出" and "使用者確認" is a hard stop: everything left of it lives only in memory (Pinia store state), and nothing right of it runs until the user explicitly triggers it (e.g. tapping "確認加入冰箱").

## Layer responsibilities

This slots into the existing layered architecture (see `.claude/skills/frontend/SKILL.md`) without inventing a parallel stack. There is no new repository — the vision model isn't Supabase, and the eventual write reuses the existing `foods` table path:

```
Service    src/services/aiVisionService.js   — calls the vision model, maps its raw response into RecognizedFoodItem[]. Never touches Supabase.
Types      src/types/foodRecognition.js      — JSDoc @typedef for RecognizedFoodItem (the pre-confirmation shape)
Store      src/stores/aiVision.js            — holds recognizedItems (draft state) only; confirm action delegates to the existing food store
Component  src/components/AiRecognitionResult.vue — presentational checklist UI (the confirmation screen)
View       src/views/ScanFood.vue            — orchestrates: pick/take photo → analyze → show confirmation → confirm; owns isAnalyzing/isSubmitting/errorMessage as local refs, per `.claude/skills/backend/SKILL.md`'s loading-state convention
```

- `aiVisionService.js` is the *only* place that calls the vision API. It never imports `supabaseClient.js` for table access, a repository, or `foodService.js` — its job stops at producing structured, unconfirmed candidates.
- Writing the confirmed items to the database is **not** a new code path — it reuses `useFoodStore().addFood()` → `foodService.insertFood()` → `refrigeratorRepository.createItem()` exactly as a manual `FoodForm.vue` submission does. The vision pipeline only ever feeds the *existing* add-food path, and only after confirmation.

## Vision API key never reaches the frontend

This app deploys to GitHub Pages — a static host with no server component at runtime. That rules out putting the vision API key in any `VITE_`-prefixed env var (it would be compiled straight into the shipped JS bundle, unlike the Supabase anon key, which is meant to be public and is protected by RLS instead):

- The actual call to the vision model lives in `supabase/functions/analyze-food-image/index.ts`, a Supabase Edge Function — the only thing that reads the `ANTHROPIC_API_KEY` secret (`supabase secrets set ANTHROPIC_API_KEY=...`).
- `aiVisionService.js` never calls the vision API directly. It calls `supabase.functions.invoke('analyze-food-image', { body: { image, mediaType } })` — same `if (error) throw error` shape as a repository call — and the Edge Function does the actual model call server-side.
- If CI needs to provision that secret, the raw key lives in GitHub Actions secrets and a deploy step pushes it into Supabase (`supabase secrets set ANTHROPIC_API_KEY=${{ secrets.ANTHROPIC_API_KEY }}`) — GitHub secrets are never used to inject the key into the frontend build the way `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are.
- The Edge Function requests **structured output**, not free text it has to parse itself: `client.messages.parse({ output_config: { format } })` where `format` is a `{ type: 'json_schema', schema, parse }` object — `schema` constrains the model's response at the API level (`category` is a JSON Schema `enum: CATEGORIES`), and `parse` is our own hand-rolled validator that `messages.parse()` calls to populate `response.parsed_output` (any object with a `parse` function works — it doesn't have to come from `zodOutputFormat()`). The client-side `CATEGORIES.includes(...)` fallback to `'其他'` in `aiVisionService.js` is a defensive second check on an external boundary, not the primary mechanism.
- **Deliberately not using `zodOutputFormat()`/`zod` here.** `zodOutputFormat()` calls the Anthropic SDK's own bundled `zod/v4` on a schema built from a separately-`npm:`-imported `zod` package — if Deno resolves those as two different module instances, zod's internal type checks throw synchronously on every call, before any network request, which looks like an unconditional 500 with no clue why. Three fields (`name`/`category`/`confidence`) don't need a schema library: hand-write the JSON Schema object and a small `parse(content)` function that does `JSON.parse` + manual field checks, and pass `{ type: 'json_schema', schema, parse }` directly as `output_config.format`. If a future change to this function genuinely needs a heavier schema (nested/recursive shapes), reach for a schema library again, but verify in a real Deno deploy (not just locally) that the SDK's internal zod and the function's own zod resolve to the same instance first.
- **Edge Functions run on Deno, not Node** — `supabase/functions/analyze-food-image/index.ts` uses `Deno.serve(...)` and `npm:`-prefixed import specifiers (e.g. `npm:@anthropic-ai/sdk@0.125.0`), which Deno resolves itself at deploy/run time. Never `npm install` these into the main project's `package.json`/`node_modules`, and never rewrite the handler as Node's `http.createServer` — that combination silently breaks the function (it either fails to run at all or, from the browser, looks like a CORS error on the preflight `OPTIONS` request because the crash happens before any response, CORS or otherwise, is returned).
- **`verify_jwt = false` in `supabase/config.toml` for this function, on purpose.** The platform's automatic JWT check runs before a CORS preflight (`OPTIONS`) request reaches the function, and browsers never send an `Authorization` header on preflight — so with the check on, preflight gets rejected and the browser reports it as a CORS failure (`FunctionsFetchError: Failed to send a request to the Edge Function`), not an auth failure. Auth is instead verified *inside* `index.ts`, after the `OPTIONS` branch: read the `Authorization` header, construct a `createClient` with `SUPABASE_URL`/`SUPABASE_ANON_KEY` (auto-injected into every Edge Function's env, no secret to set) and that header, then reject with 401 unless `supabaseClient.auth.getUser()` resolves a user. Don't drop this check when touching the function — with `verify_jwt` off, it's the only thing standing between the (paid, per-call) vision API and an anonymous caller.

## Structured output shape

Recognition results are not `Food` objects — they lack an `id`, haven't been through category validation, and might be wrong. Give them their own type so nothing can mistake a draft for a persisted record:

```js
// src/types/foodRecognition.js
/**
 * @typedef {Object} RecognizedFoodItem
 * @property {string} tempId       - client-generated id (crypto.randomUUID()), never a DB id
 * @property {string} name
 * @property {string} category     - one of utils/constants.js CATEGORIES; the Edge Function's schema constrains the model to these values, but the client still defensively falls back to '其他' on anything unexpected crossing that boundary
 * @property {string} emoji        - for the confirmation checklist (🥚🍅🥬🍗...)
 * @property {number} [confidence] - optional 0-1, model-reported; never used to skip confirmation
 * @property {boolean} selected    - defaults to true; user can uncheck before confirming
 */

export {}
```

`aiVisionService.recognizeFoods(imageFile)` returns `RecognizedFoodItem[]` with `selected: true` and a fresh `tempId` on every item — it never returns something already shaped like `Food`.

## Store contract

`src/stores/aiVision.js` follows the same thin-wrapper pattern as other stores (`.claude/skills/backend/SKILL.md`), split into two actions so analysis and persistence stay clearly separate:

```js
export const useAiVisionStore = defineStore('aiVision', () => {
  const recognizedItems = ref([])

  async function analyzeImage(imageFile) {
    recognizedItems.value = await recognizeFoods(imageFile)
  }

  function updateItem(tempId, updates) {
    const item = recognizedItems.value.find((i) => i.tempId === tempId)
    if (item) Object.assign(item, updates)
  }

  function removeItem(tempId) {
    recognizedItems.value = recognizedItems.value.filter((i) => i.tempId !== tempId)
  }

  function discard() {
    recognizedItems.value = []
  }

  // Only entry point that writes to Supabase — must be called from an explicit user action.
  async function confirmSelected() {
    const foodStore = useFoodStore()
    const toAdd = recognizedItems.value.filter((i) => i.selected)
    const results = await Promise.allSettled(
      toAdd.map((item) =>
        foodStore.addFood({ name: item.name, category: item.category, quantity: 1, expiryDate: null }),
      ),
    )
    const failedIds = new Set(
      toAdd.filter((_, i) => results[i].status === 'rejected').map((item) => item.tempId),
    )
    // Keep failed items in the draft so the user can retry instead of losing their confirmation.
    recognizedItems.value = recognizedItems.value.filter((item) => failedIds.has(item.tempId))
    if (failedIds.size > 0) throw new Error(`${failedIds.size} 項加入失敗，請重試`)
  }

  return { recognizedItems, analyzeImage, updateItem, removeItem, discard, confirmSelected }
})
```

- Per `.claude/skills/backend/SKILL.md`'s loading-state convention, `isAnalyzing`/`isSubmitting`/`errorMessage` are **not** store state — they're local `ref`s in `ScanFood.vue`, set around the `analyzeImage`/`confirmSelected` calls exactly like `FoodForm.vue` does around `addFood`/`updateFood`. The store holds only the draft data (`recognizedItems`), not UI state.
- `analyzeImage` never calls `confirmSelected` itself, directly or via a "if confidence > X, auto-add" shortcut. Consuming components own that call, and it happens only on a button click.
- Both actions `throw` rather than swallow — `analyzeImage` lets `recognizeFoods`'s rejection propagate untouched; `confirmSelected` uses `Promise.allSettled` internally (not `try/catch`) only to let *other* selected items keep saving when one fails, then re-throws a summary error so the View still sees a rejection and can render `errorMessage`. Items that failed to save are kept in `recognizedItems` (not dropped) so the user can retry instead of re-confirming from scratch.

## Confirmation UI

The confirmation screen is mandatory, not optional polish. Minimum shape, matching how the product is meant to read (checklist of what was found, no silent auto-add):

```
AI 辨識結果

☑ 🥚 雞蛋
☑ 🍅 番茄
☑ 🥬 高麗菜
☑ 🍗 雞胸肉

[確認加入冰箱]
```

- Each row is a checkbox (`selected`), pre-checked, editable — the user can uncheck items the model got wrong rather than being forced to accept-all-or-nothing.
- Allow editing `name`/`category` inline before confirming (e.g. the model says "肉" but the user wants to correct it to "雞胸肉" or fix the category) — don't make users delete-and-manually-re-add to fix a near-miss.
- Show an explicit empty/failure state ("沒有辨識到食材，請手動新增" / "辨識失敗，請稍後再試或手動新增") with a link into the existing `FoodForm.vue` manual-add flow — AI Vision is one input path, never the only one.
- The "確認加入冰箱" button calls `aiVisionStore.confirmSelected()` and should show its own `isSubmitting` state (per `.claude/skills/backend/SKILL.md`'s loading-state convention), disabling itself while the writes are in flight.

## Don'ts

- Don't call `foodService.insertFood` / `refrigeratorRepository.createItem` directly from `aiVisionService.js` or from inside `analyzeImage` — the only write path is `confirmSelected()`, triggered by the user.
- Don't skip the confirmation screen for "high confidence" results, and don't use `confidence` to auto-select/auto-deselect in a way the user can't see or override.
- Don't persist `recognizedItems` to Supabase or `localStorage` — it's ephemeral Pinia state that's gone once confirmed or discarded/navigated away from.
- Don't let the vision service invent categories outside `utils/constants.js` `CATEGORIES` — map unknowns to `'其他'` rather than writing an arbitrary string into `category_code`.
- Don't put the vision API call in a repository — `src/repositories/` is reserved for direct Supabase table access (`.claude/skills/database/SKILL.md`); an external AI API call belongs in `services/` only.
