---
name: feature
description: Defines the parts a complete feature must have (View, Components, Store, Service, Repository, Types, Test) and the step-by-step order to build one. Use whenever asked to build/add a new feature end-to-end, so no layer or step gets skipped. Points to `.claude/skills/frontend/SKILL.md`, `.claude/skills/backend/SKILL.md`, and `.claude/skills/database/SKILL.md` for the conventions within each layer.
---

# Feature Development Guide

Defines what a "complete" feature looks like in this project and the order to build it in. This doesn't replace the frontend/backend/database skills — it tells you when each one applies and in what sequence. Use it whenever implementing a new feature end-to-end (not a one-off tweak to existing code).

## Anatomy of a feature

Every feature that touches persisted data ships all of these parts — don't skip a layer just because it looks small:

```
Feature
├── View          src/views/<Feature>.vue                  — route-level page, wires everything together
├── Components    src/components/<Feature>*.vue            — reusable, presentational pieces used by the View
├── Store         src/stores/<feature>.js                  — Pinia store: state + thin action wrappers
├── Service       src/services/<feature>Service.js         — maps camelCase <-> snake_case, calls the repository
├── Repository    src/repositories/<feature>Repository.js  — raw Supabase CRUD for one table
├── Types         src/types/<feature>.js                   — JSDoc @typedef for the domain shape
└── Test          src/**/__tests__/<feature>*.spec.js       — covers Store/Service logic and key View states
```

- A feature with no persistence (pure UI, e.g. a modal or a client-side filter) can skip Store/Service/Repository/Types, but still needs a View/Component split and a test.
- A feature that extends an existing domain (e.g. a new filter on the fridge list) doesn't need a new Store/Service/Repository/Types — only touch the layers that actually changed.
- Naming and internal responsibilities of each layer are defined elsewhere, not here:
  - `.claude/skills/frontend/SKILL.md` — View/Components/Router structure, auth guards, mobile-first UI
  - `.claude/skills/backend/SKILL.md` — Store↔Service contract, error propagation, validation, loading state
  - `.claude/skills/database/SKILL.md` — Service↔Repository contract, schema/naming, RLS

## Workflow

Build a feature in this order. Don't start writing components before the earlier steps are settled — most rework in this project comes from designing UI before the data shape is decided.

1. **確認需求 (Confirm requirements)** — what the feature does, who can access it (does it need `meta: { requiresAuth: true }`?), what triggers it. If ambiguous, ask rather than assume.
2. **分析資料結構 (Analyze the data structure)** — is this a new domain or an extension of an existing one (`foods`, `shopping_items`, `recipes`, `promotions`)? What fields does it need? Check `.claude/skills/database/SKILL.md` for existing schema before inventing a new table.
3. **設計 UI (Design the UI)** — sketch the View and which pieces factor out into `/components`; decide the loading/empty/error states up front, not as an afterthought.
4. **建立 Types (Define Types)** — add/extend `src/types/<feature>.js` with the JSDoc `@typedef` that components/stores/services will pass around.
5. **建立 Repository / Service** — repository first (raw Supabase CRUD, per `.claude/skills/database/SKILL.md`), then the service that maps rows to/from the Types shape.
6. **建立 Vue Component(s) and Store** — Pinia store action wraps the matching service call (per `.claude/skills/backend/SKILL.md`); Views/Components read and mutate state through the store, never the service directly.
7. **加入錯誤與 Loading 狀態 (Wire up error and loading state)** — local `isLoading`/`isSubmitting` refs in the View, an `errorMessage` ref rendered in the template, services `throw` and stores don't `catch` — per `.claude/skills/backend/SKILL.md`.
8. **執行測試 (Test)** — cover store actions/service mapping logic and the View's loading/error/empty/success states before calling the feature done. No test runner is installed yet — the first feature that adds a test should add `vitest` + `@vue/test-utils` as devDependencies and a `test` script in `package.json`.
