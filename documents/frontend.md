# Frontend 結構文件

```
src/
├── assets/                      # 打包資源存放處（圖片、圖示等），目前僅 .gitkeep 佔位
├── components/
│   ├── CategoryFilter.vue       # 分類篩選 chips（v-model 綁定選取的分類）
│   ├── ExpiryBadge.vue          # 到期狀態徽章，呼叫 utils/expiry.js 計算狀態並上色
│   ├── ItemCard.vue             # 單一物品卡片，點擊進編輯頁、可觸發刪除事件
│   ├── ItemList.vue             # 物品清單 + 空狀態提示文字
│   └── NavBar.vue               # 頂部導覽列：標題／登出鈕 + 六個分頁的橫向捲動導覽列
├── layouts/
│   ├── AuthLayout.vue           # 純內容外殼（無 NavBar），/login 使用
│   └── DefaultLayout.vue        # NavBar + <slot />，一般已登入頁面使用
├── router/
│   └── index.js                 # createRouter() 建立六個主要分頁 + 物品表單路由，並用 beforeEach 做登入守衛
├── services/
│   ├── authService.js           # 登入狀態的 localStorage 存取（token/user），日後換真實 API 只需改這裡
│   └── itemsService.js          # 物品資料的 localStorage 存取
├── stores/
│   ├── auth.js                  # Pinia store：isLoggedIn／login()／logout()，委派 authService 做持久化
│   └── items.js                 # Pinia store：items CRUD（addItem／updateItem／deleteItem／getItem）
├── types/
│   └── item.js                  # JSDoc @typedef 定義 Item 資料形狀（專案不使用 TypeScript）
├── utils/
│   ├── constants.js             # CATEGORIES 分類清單（蔬果／肉類／乳製品／飲品／其他）
│   └── expiry.js                # getExpiryStatus()：依到期日換算 ok／soon／expired／none 四種狀態
├── views/
│   ├── Home.vue                  # 首頁儀表板：卡片式導覽連到其餘五個分頁
│   ├── Refrigerator.vue          # 我的冰箱：物品清單，含分類篩選、依到期日排序、新增物品的浮動按鈕
│   ├── ShoppingList.vue          # 採買清單（佔位頁面，功能開發中）
│   ├── Recipes.vue               # 食譜（佔位頁面，功能開發中）
│   ├── Favorites.vue             # 最愛食譜（佔位頁面，功能開發中）
│   ├── Promotions.vue            # 特價食材（佔位頁面，功能開發中）
│   ├── ItemForm.vue              # 新增／編輯物品表單，依路由是否帶 :id 判斷模式，含刪除功能
│   └── Login.vue                 # 登入表單
├── App.vue                       # 依 route.meta.layout 動態切換 DefaultLayout／AuthLayout
├── main.js                       # createApp(App).use(createPinia()).use(router).mount('#app')
└── style.css                     # mobile-first 基礎樣式（light/dark 主題、觸控友善）
```

## 重點功能

- **頁面路由**：`src/router/index.js` 用 `createRouter()` 建立六個主要分頁——`/`（home）、`/refrigerator`、`/shopping-list`、`/recipes`、`/favorites`、`/promotions`——外加 `/items/new`、`/items/:id/edit` 兩個物品表單路由，全部設 `meta: { requiresAuth: true }`
- **登入守衛**：`router.beforeEach` 依 `useAuthStore().isLoggedIn` 保護需登入的路由（未登入導向 `/login` 並帶 `redirect` query），已登入者也無法停留在 `/login`；`/login` 另設 `meta: { layout: 'auth' }` 套用無 NavBar 的外殼
- **登入登出**：`stores/auth.js`（Pinia setup store）管理 `isLoggedIn`／`user`，實際 token 讀寫委派給 `services/authService.js`（目前用 `localStorage` 模擬，日後接上真實 API 時只需改這一層）；`components/NavBar.vue` 依 `auth.isLoggedIn` 顯示登出按鈕與分頁導覽
- **分頁導覽**：`NavBar.vue` 在登入後顯示六個分頁的連結列（首頁／我的冰箱／採買清單／食譜／最愛食譜／特價食材），橫向可捲動且每個連結 ≥44px 觸控區塊，`active-class` 標示目前所在分頁
- **物品 CRUD**：`stores/items.js`（Pinia）提供 `addItem`／`updateItem`／`deleteItem`／`getItem`，資料持久化委派給 `services/itemsService.js`；`views/Refrigerator.vue` 顯示清單並依到期日排序，`views/ItemForm.vue` 依路由參數 `:id` 是否存在判斷「新增」或「編輯」模式
- **到期提醒**：`utils/expiry.js` 的 `getExpiryStatus()` 依到期日換算「已過期／即將到期（3 天內）／正常／未設定」四種狀態，`components/ExpiryBadge.vue` 依狀態上色顯示
- **Layout 切換**：`App.vue` 依當前路由的 `route.meta.layout` 動態選擇 `layouts/DefaultLayout.vue`（含 NavBar）或 `layouts/AuthLayout.vue`（無 NavBar，登入頁用）
- **手機優先**：base CSS 先寫小螢幕樣式，`min-width: 768px` 再加桌機調整；按鈕與導覽連結 tap 區塊 ≥44px（見 `style.css` 與各元件的 `<style scoped>`）
