---
name: docs
description: Generate topic documentation into documents/<topic>.md by analyzing the relevant part of the codebase. Invoke via /docs <topic> (e.g. /docs frontend, /docs backend, /docs api) whenever that area of the project changes and its docs need to be refreshed.
---

# Generate Topic Docs

Produce `documents/<topic>.md` (relative to the project root; create the `documents/` folder if it doesn't exist) documenting the current state of the given topic area of the codebase.

`<topic>` is passed as an argument (e.g. `/docs frontend`, `/docs backend`, `/docs api`). If no topic is given, ask the user which topic to document rather than guessing.

## Steps

1. Figure out which directories/files are relevant to `<topic>` by inspecting the repo's actual structure (e.g. `frontend` → `src/`; `backend`/`api` → wherever the server code lives; other topics → whatever directory or module name matches). Don't assume a fixed layout — re-derive it each run from what's actually in the repo.
2. Read those files to understand the structure and how the key pieces fit together (don't assume it matches a past doc — re-derive it each run).
3. Write `documents/<topic>.md` with two sections:
   - A directory tree of the relevant area with a short inline comment per file/folder explaining its role.
   - A "重點功能" (key features) section summarizing, in a few bullet points, the notable mechanisms in that area (e.g. for a frontend topic: routing/auth guards, login/logout, responsive design; for a backend topic: API structure, data layer, auth middleware — adapt to what's actually there) — cite the specific file and mechanism for each point.
4. Write the doc in Traditional Chinese, matching the tone/format of the example below.

## Output format (example — a `frontend` topic doc)

```
src/
├── components/NavBar.vue      # 頂部導覽列，含登出按鈕
├── composables/useAuth.js     # 登入狀態管理（localStorage 持久化）
├── router/index.js            # const router = createRouter(...) + beforeEach 路由守衛
├── views/
│   ├── Home.vue                # 需登入才能進入
│   └── Login.vue               # 登入表單
├── App.vue                     # NavBar + <router-view>
├── main.js                     # createApp(App).use(router).mount('#app')
└── style.css                   # mobile-first 基礎樣式（light/dark、觸控友善）

重點功能：
- 路由：src/router/index.js 用 createRouter() 直接建立，並用 router.beforeEach 保護需登入的路由（meta: { requiresAuth: true }），未登入會導向 /login
- 登入登出：useAuth() composable 管理狀態並持久化到 localStorage；NavBar.vue 依登入狀態顯示登出按鈕
- 手機優先：base CSS 先寫小螢幕樣式，min-width: 768px 再加桌機調整；按鈕 tap 區塊 ≥44px
```

This is only an illustration of the expected depth/format for a `frontend` topic. For any other topic, scan the relevant area of the repo and produce an equivalent tree + key-features doc for that area instead — don't copy this example's content verbatim for unrelated topics.
