---
name: frontend
description: Vue 3 + JavaScript frontend conventions for this project — component/router structure, login/logout auth flow, and mobile-first responsive UI. Use whenever building or editing frontend code (components, routes, pages, auth) in this repo.
---

# Frontend Development Guide

Conventions for building the frontend of this project. Follow these whenever creating or modifying frontend code.

## Tech Stack

- **Framework**: Vue 3 (Composition API preferred)
- **Language**: JavaScript (no TypeScript)
- **Routing**: Vue Router 4
- **State management**: Pinia (setup stores in `/stores`)

## Project Structure

```
src/
├── assets/           # Bundled static assets (images, icons) imported by components
├── components/       # Reusable, presentational Vue components
├── layouts/          # Layout shells (e.g. DefaultLayout with NavBar, AuthLayout without)
├── views/            # Page-level components (route targets)
├── router/           # Route definitions
│   └── index.js
├── stores/           # Pinia stores for state shared across pages (auth, food, shoppingList, ...)
├── services/         # Data-access layer (localStorage today, Supabase/API calls once wired up)
├── types/            # JSDoc @typedef definitions for shared data shapes (Food, Recipe, ShoppingItem, User, ...)
├── utils/            # Small stateless helpers (formatting, derived-status calculations, constants)
├── App.vue           # Picks a layout from route.meta.layout and renders <router-view>
└── main.js
```

- Put reusable, presentational pieces in `/components`.
- Put route-level page components in `/views` and reference them from `/router`.
- `/stores` holds Pinia stores for any state that needs to be shared across pages/components — current user, fridge food, shopping list, etc. Components should read/mutate state through a store, not by talking to `localStorage`/an API directly.
- `/services` is the only layer allowed to touch persistence/IO (currently `localStorage`; later Supabase or another API). Stores call into a same-named service (e.g. `stores/food.js` calls `services/foodService.js`) so components never do data access directly — this is what keeps the future Supabase migration contained to `/services` instead of touching every component.
- `/types` holds one JSDoc `@typedef` file per domain entity (e.g. `types/food.js`, `types/recipe.js`, `types/shoppingItem.js`, `types/user.js`) describing the shape stores/services work with — no runtime code, just documentation for editor intellisense (project is JS-only, no TypeScript).
- Set `meta: { layout: 'auth' }` on routes that shouldn't show the default chrome (e.g. `/login`); omit it to fall back to `DefaultLayout`.

## Router Setup

Define the router in `src/router/index.js` using `createRouter()` directly (no wrapper factory functions):

```js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/login', name: 'login', component: Login, meta: { requiresAuth: false } },
    // protected routes should set meta: { requiresAuth: true }
  ],
})

export default router
```

Register it in `main.js` via `app.use(router)`.

## Authentication (Login / Logout)

- Keep auth state in `stores/auth.js` (Pinia) — expose `isLoggedIn`, `login()`, `logout()`, and current user (`types/user.js`); delegate persistence to `services/authService.js`.
- Persist the session token (e.g. `localStorage`) so a page refresh keeps the user logged in; clear it on logout.
- Use a global `router.beforeEach` navigation guard to redirect unauthenticated users away from routes with `meta: { requiresAuth: true }`, and redirect logged-in users away from `/login`.
- Provide a visible login/logout entry point in the main nav/header component under `/components` (e.g. `NavBar.vue`) that toggles based on auth state.

## UI / Responsive Design

- **Design mobile-first**: write base styles for small screens first, then layer on larger-screen adjustments with `min-width` media queries (or your CSS framework's responsive utilities, if one is added).
- Ensure touch targets (buttons, nav items) are large enough for mobile use (~44px minimum tap area).
- Verify every component/page works and looks correct at common breakpoints (mobile ~375px, tablet ~768px, desktop ~1280px) before considering it done.
- Avoid fixed pixel widths on layout containers; prefer relative units (`%`, `rem`, `vw`) and flexbox/grid so layouts adapt across screen sizes.
