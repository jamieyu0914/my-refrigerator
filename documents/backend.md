# Backend / Data Flow 結構文件

```
src/
├── stores/
│   ├── food.js            # Pinia setup store：foods 陣列 + loadFoods／addFood／updateFood／deleteFood／fetchFood，全是呼叫 foodService 的薄封裝
│   ├── shoppingList.js    # items 陣列 + loadItems／addItem／togglePurchased／updateItem／deleteItem，只呼叫 shoppingListService
│   ├── recipe.js          # recipes 陣列 + loadRecipes／addRecipe／updateRecipe／toggleFavorite／fetchRecipe，只呼叫 recipeService
│   └── auth.js            # user／isLoggedIn + init／login／logout，只呼叫 authService
├── services/
│   ├── foodService.js         # store 與 repository 之間的欄位轉換層（詳細的表結構/RLS 見 documents/database.md）
│   ├── shoppingListService.js # 同上
│   ├── recipeService.js       # 同上
│   └── authService.js         # 同上
├── views/
│   ├── Refrigerator.vue   # isLoading／errorMessage／deletingIds（陣列，防同一項目重複刪除），刪除前 confirm()
│   ├── FoodForm.vue       # isLoading／isSubmitting／errorMessage，新增與編輯共用同一個 handleSubmit，刪除前 confirm()
│   ├── ShoppingList.vue   # isLoading／isAdding／isSavingEdit／togglingIds／deletingIds／editingId，並在 handleToggle() 裡跨 store 呼叫 useFoodStore()
│   ├── Recipes.vue        # isLoading／errorMessage／togglingIds（陣列，防同一筆重複切換最愛），右下角 FAB 連到 /recipes/new
│   ├── Favorites.vue      # 跟 Recipes.vue 共用同一個 recipeStore，用 computed 篩出 isFavorite 為 true 的清單
│   ├── RecipeDetail.vue   # 用 fetchRecipe(id) 直接查單筆（不依賴列表快取），isTogglingFavorite 是單一 boolean（單筆頁面不需要陣列）
│   └── RecipeForm.vue     # 只做新增；isSubmitting／errorMessage，food/steps 用可新增/移除列的陣列（`form.ingredients`／`form.steps`），標籤用單一 text input 依逗號切開，送出前濾掉空白列
├── components/
│   ├── FoodCard.vue         # 接收 deleting prop，刪除進行中時 disable 垃圾桶按鈕
│   ├── ShoppingItemRow.vue  # 接收 editing／saving／toggling／deleting props，各自 disable 對應操作、不自己呼叫 store
│   └── RecipeCard.vue／RecipeList.vue  # 接收 toggling／togglingIds props，點擊收藏鈕 emit toggle-favorite、不自己呼叫 store；RecipeList 的空狀態文字用 emptyMessage prop，讓 Favorites.vue 換文案
└── utils/
    └── constants.js        # CATEGORIES，被 FoodForm.vue／ShoppingList.vue 的分類下拉選單與預設值共用
```

## 重點功能

- **Store↔Service 契約**：store action 是薄封裝——呼叫對應 service 後直接用回傳值更新本地陣列（`push`／`findIndex` 後原地替換或 `Object.assign`／`splice`），不會為了同步而重新 fetch 整個列表；命名衝突時只 alias import 而不是改 service 的匯出名稱（例：`stores/food.js` 的 `import { updateFood as updateFoodRow } from '../services/foodService'`）。每個 store 只認識自己對應的 service，不會直接 import `supabaseClient.js` 或其他 domain 的 service（見 `.claude/skills/backend/SKILL.md`）
- **Error 一路往上丟，只有觸發動作的 View 接住**：service 用 `throw` 往外丟，store action 不包 try/catch，讓 rejection 原樣往上傳；真正 catch 的地方永遠是觸發動作的 View（例如 `Refrigerator.vue` 的 `handleDelete`、`FoodForm.vue` 的 `handleSubmit`、`ShoppingList.vue` 的 `handleToggle`/`handleEditSave`），統一寫進 `errorMessage` ref 並在 template 用 `<p v-if="errorMessage">` 顯示，不用 `alert()`／`console.error`
- **Loading／Submitting 狀態是 View 本地的，不放進 Pinia**：每個 View 自己管理 `isLoading`（首次載入）與 `isSubmitting`／`isAdding`／`isSavingEdit`（寫入動作進行中），非同步呼叫一律包 `try/catch/finally`，`finally` 裡重置 loading flag，避免請求失敗時畫面卡在「載入中」。清單類頁面的單列動作（刪除、勾選）用一個 id 陣列（`deletingIds`／`togglingIds`）而不是單一 boolean，防止同一列被連續點擊觸發兩次請求——`Refrigerator.vue` 與 `ShoppingList.vue` 都是這個 pattern，並把陣列往下傳給 `FoodCard.vue`／`ShoppingItemRow.vue` 當 `disabled` 條件
- **輸入驗證只發生在觸發動作的 component**：store／service 都信任輸入、不再檢查——必填欄位用 guard clause（`if (!form.name.trim()) return`）、字串一律 `.trim()`、數字用 `Number(...) || 預設值` 正規化、可為空的欄位用 `|| null` 轉換，這些都在送進 store 之前就處理好。刪除這類破壞性操作在觸發前用 `confirm()` 二次確認，`Refrigerator.vue`／`FoodForm.vue`／`ShoppingList.vue` 的刪除都一致
- **跨 domain 動作放在 View 層，不放進 store**：`stores/shoppingList.js` 依規定不能呼叫 `foodService`／`useFoodStore()`，所以「採買清單勾選已購買→自動加入我的冰箱」這個橫跨兩個 domain 的動作寫在 `ShoppingList.vue` 的 `handleToggle()`：同一個 View 同時使用 `useShoppingListStore()` 與 `useFoodStore()` 兩個 store（View 組合多個 store 是允許的，只是 store 之間、以及 store 對外部 service 不能互相呼叫）。取消勾選不會反向處理冰箱裡的食材，這是刻意的設計取捨
- **編輯狀態集中在 View，元件保持無狀態**：`ShoppingList.vue` 用單一 `editingId` 決定整份清單同時只有一列能進入編輯模式，`ShoppingItemRow.vue` 純粹依 `editing` prop 切換顯示、把使用者輸入透過 `edit-save` emit 往上丟，自己不呼叫 store，維持元件的「純呈現、不碰資料」分工
- **食譜／最愛食譜共用同一個 store、各自本地載入**：`Recipes.vue`／`Favorites.vue` 都在自己的 `onMounted` 呼叫 `recipeStore.loadRecipes()`（不共用快取旗標），`Favorites.vue` 用 `computed` 從同一份 `recipeStore.recipes` 篩出 `isFavorite` 為 true 的清單，不是另外呼叫 service；`toggleFavorite(id, currentValue)` 需要呼叫端主動傳入目前的 `isFavorite` 值，因為 `RecipeDetail.vue` 可能直接從網址進入、`recipeStore.recipes` 裡未必已經有這筆資料，所以不能像 `togglePurchased` 一樣完全依賴本地陣列查找；`updateRecipe`／`toggleFavorite` 這兩個 store action 會回傳更新後的 Recipe，讓 `RecipeDetail.vue` 能同步自己本地的 `recipe` ref（`stores/food.js` 的對應 action 則不回傳值，因為 `FoodForm.vue` 不需要）。新增食譜表單只做 create，沒有編輯/刪除
- **食材／步驟是表單裡「可新增/移除列」的陣列，不是逗號/換行字串**：`RecipeForm.vue` 的 `form.ingredients`（`{name, amount}[]`）／`form.steps`（`{description}[]`）各自預設帶一列空白，`+ 新增食材`／`+ 新增步驟` 往陣列 push 一列、垃圾桶圖示 `splice` 移除（最少保留一列，`form.ingredients.length === 1` 時 disable 移除鈕），畫面上的陣列順序就是送出時的 `sort_order`；送出前把「名稱／描述為空」的列濾掉再組 payload，交給 `recipeStore.addRecipe()` 原封不動往下傳，欄位轉換與寫入子表都在 `recipeService.insertRecipe()`（見 `documents/database.md`），store／component 都不知道底層是三張表
