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

## Project Structure

```
src/
├── components/       # Reusable Vue components
├── router/           # Route definitions
│   └── index.js
├── views/            # Page-level components (route targets)
├── App.vue
└── main.js
```

- Put reusable, presentational pieces in `/components`.
- Put route-level page components in `/views` and reference them from `/router`.

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

- Keep auth state in a small store (e.g. Pinia, or a simple reactive composable if no store library is added) — expose `isLoggedIn`, `login()`, `logout()`, and current user info.
- Persist the session token (e.g. `localStorage`) so a page refresh keeps the user logged in; clear it on logout.
- Use a global `router.beforeEach` navigation guard to redirect unauthenticated users away from routes with `meta: { requiresAuth: true }`, and redirect logged-in users away from `/login`.
- Provide a visible login/logout entry point in the main nav/header component under `/components` (e.g. `NavBar.vue`) that toggles based on auth state.

## UI / Responsive Design

- **Design mobile-first**: write base styles for small screens first, then layer on larger-screen adjustments with `min-width` media queries (or your CSS framework's responsive utilities, if one is added).
- Ensure touch targets (buttons, nav items) are large enough for mobile use (~44px minimum tap area).
- Verify every component/page works and looks correct at common breakpoints (mobile ~375px, tablet ~768px, desktop ~1280px) before considering it done.
- Avoid fixed pixel widths on layout containers; prefer relative units (`%`, `rem`, `vw`) and flexbox/grid so layouts adapt across screen sizes.
