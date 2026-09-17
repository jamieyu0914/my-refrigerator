# Frontend 結構文件

```
src/
├── assets/                        # 打包資源存放處（圖片、圖示等），目前僅 .gitkeep 佔位
├── components/
│   ├── AiRecognitionResult.vue    # AI 辨識結果的可編輯清單：勾選／改名／改分類／移除，「確認加入冰箱」按鈕
│   ├── CategoryFilter.vue         # 分類篩選 chips（v-model 綁定選取的分類）
│   ├── ExpiryBadge.vue            # 到期狀態徽章，呼叫 utils/expiry.js 計算狀態並上色
│   ├── FoodCard.vue               # 單一冰箱物品卡片，點擊進編輯頁、可觸發刪除事件
│   ├── FoodList.vue               # 冰箱物品清單 + 空狀態提示文字
│   ├── ImageCapture.vue           # <input type="file" capture="environment"> 拍照/選圖 + 預覽，選好即 emit('select', file)
│   ├── NavBar.vue                 # 頂部導覽列：標題／登出鈕 + 七個分頁的橫向捲動導覽列
│   ├── RecipeCard.vue             # 單一食譜卡片，含收藏愛心按鈕
│   ├── RecipeList.vue             # 食譜清單，emptyMessage prop 讓不同頁面客製空狀態文案
│   ├── RecipeSearchInput.vue      # 食譜搜尋輸入框（v-model）
│   └── ShoppingItemRow.vue        # 採買清單單列，checkbox／編輯／刪除，editing prop 切換成編輯表單
├── layouts/
│   ├── AuthLayout.vue             # 純內容外殼（無 NavBar），/login 使用
│   └── DefaultLayout.vue          # NavBar + <slot />，一般已登入頁面使用
├── repositories/                   # Supabase 資料存取層，詳見 documents/database.md
├── router/
│   └── index.js                    # createRouter() 建立八個主要路由 + 食譜/物品表單路由，並用 beforeEach 做登入守衛
├── services/                       # 業務邏輯層（含 aiVisionService.js），詳見 documents/backend.md、documents/database.md
├── stores/                         # Pinia stores（含 aiVision.js），詳見 documents/backend.md
├── types/                          # JSDoc @typedef 資料形狀定義（專案不使用 TypeScript），詳見 documents/database.md
├── utils/
│   ├── constants.js                # CATEGORIES 分類清單（蔬果／肉類／乳製品／飲品／其他）
│   ├── expiry.js                   # getExpiryStatus()：依到期日換算 ok／soon／expired／none 四種狀態
│   └── recipeSearch.js             # matchesRecipeSearch()：食譜標題/標籤關鍵字比對（大小寫不敏感）
├── views/
│   ├── Home.vue                    # 首頁儀表板：卡片式導覽連到我的冰箱／採買清單／食譜／最愛食譜／特價食材
│   ├── Refrigerator.vue            # 我的冰箱：物品清單，含分類篩選、新增物品的浮動按鈕
│   ├── ScanFood.vue                # 拍照辨識食材：ImageCapture → 呼叫 AI Vision → AiRecognitionResult 供使用者確認後寫入冰箱
│   ├── ShoppingList.vue            # 採買清單：新增表單、勾選已購買（連動加入冰箱）、行內編輯、刪除
│   ├── Recipes.vue                 # 食譜列表，含搜尋、右下角 FAB 連到新增食譜
│   ├── Favorites.vue               # 最愛食譜（與 Recipes 共用 recipeStore，篩出 isFavorite）
│   ├── RecipeDetail.vue            # 食譜詳情，isOwn 為 true 才顯示編輯/刪除按鈕
│   ├── RecipeForm.vue              # 新增／編輯食譜共用表單，依 :id 是否存在判斷模式
│   ├── Promotions.vue              # 特價食材（佔位頁面，功能開發中）
│   ├── FoodForm.vue                # 新增／編輯冰箱物品表單，依路由是否帶 :id 判斷模式，含刪除功能
│   └── Login.vue                   # 登入表單
├── App.vue                         # 依 route.meta.layout 動態切換 DefaultLayout／AuthLayout
├── main.js                         # authStore.init() 完成後才 createApp(App).use(pinia).use(router).mount('#app')
├── test-setup.js                   # Vitest 全域設定：stub 全域註冊的 RouterLink／RouterView
└── style.css                       # mobile-first 基礎樣式（light/dark 主題、觸控友善）
```

## 重點功能

- **頁面路由**：`src/router/index.js` 用 `createRouter()` 建立八個主要路由——`/`（home）、`/refrigerator`、`/scan`、`/shopping-list`、`/recipes`（含 `/recipes/new`、`/recipes/:id`、`/recipes/:id/edit`）、`/favorites`、`/promotions`——外加 `/food/new`、`/food/:id/edit` 兩個物品表單路由，全部設 `meta: { requiresAuth: true }`
- **登入守衛**：`router.beforeEach` 依 `useAuthStore().isLoggedIn` 保護需登入的路由（未登入導向 `/login` 並帶 `redirect` query），已登入者也無法停留在 `/login`；`/login` 另設 `meta: { layout: 'auth' }` 套用無 NavBar 的外殼；`main.js` 會先 `await authStore.init()`（向 Supabase 查一次現有 session）才掛載 router，避免重新整理頁面時守衛誤判成未登入
- **登入登出**：`stores/auth.js`（Pinia setup store）管理 `isLoggedIn`／`user`，實際驗證委派給 `services/authService.js`（呼叫 Supabase Auth，詳見 `documents/database.md`）；`components/NavBar.vue` 依 `auth.isLoggedIn` 顯示登出按鈕與分頁導覽
- **分頁導覽**：`NavBar.vue` 在登入後顯示七個分頁的連結列（首頁／我的冰箱／拍照辨識／採買清單／食譜／最愛食譜／特價食材），橫向可捲動且每個連結 ≥44px 觸控區塊，`active-class` 標示目前所在分頁
- **拍照辨識食材（AI Vision）**：`views/ScanFood.vue` 串起 `ImageCapture.vue`（拍照/選圖）→ `stores/aiVision.js` 的 `analyzeImage()`（呼叫 Supabase Edge Function 辨識）→ `AiRecognitionResult.vue`（辨識結果的可編輯草稿：勾選／改名／改分類／移除，低信心值項目標「請確認」）→ 使用者按「確認加入冰箱」才觸發 `confirmSelected()` 寫入 `foodStore`；辨識結果在使用者確認前完全不會寫入 Supabase（遵循 `.claude/skills/ai-vision/SKILL.md` 的規則），詳見 `documents/backend.md`
- **物品 CRUD**：`stores/food.js`（Pinia）提供 `addFood`／`updateFood`／`deleteFood`／`fetchFood`，資料存取委派給 `services/foodService.js`；`views/Refrigerator.vue` 顯示清單並可依分類篩選，`views/FoodForm.vue` 依路由參數 `:id` 是否存在判斷「新增」或「編輯」模式
- **到期提醒**：`utils/expiry.js` 的 `getExpiryStatus()` 依到期日換算「已過期／即將到期（3 天內）／正常／未設定」四種狀態，`components/ExpiryBadge.vue` 依狀態上色顯示
- **Layout 切換**：`App.vue` 依當前路由的 `route.meta.layout` 動態選擇 `layouts/DefaultLayout.vue`（含 NavBar）或 `layouts/AuthLayout.vue`（無 NavBar，登入頁用）
- **手機優先**：`style.css` 先寫小螢幕樣式，`min-width: 768px` 再加桌機調整；按鈕與導覽連結 tap 區塊 ≥44px（見 `style.css` 與各元件的 `<style scoped>`）；`ImageCapture.vue` 的 `<input type="file" capture="environment">` 讓手機直接喚起相機
