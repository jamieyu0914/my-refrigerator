# Frontend 結構文件

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
```

## 重點功能

- **路由**：`src/router/index.js` 用 `createRouter()` 直接建立，並用 `router.beforeEach` 保護需登入的路由（`meta: { requiresAuth: true }`），未登入會導向 `/login`
- **登入登出**：`useAuth()` composable 管理狀態並持久化到 `localStorage`；`NavBar.vue` 依登入狀態顯示登出按鈕
- **手機優先**：base CSS 先寫小螢幕樣式，`min-width: 768px` 再加桌機調整；按鈕 tap 區塊 ≥44px
