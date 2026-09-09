# Backend / Data Flow 結構文件

```
src/
├── stores/
│   ├── food.js            # Pinia setup store：foods 陣列 + loadFoods／addFood／updateFood／deleteFood／fetchFood，全是呼叫 foodService 的薄封裝
│   ├── shoppingList.js    # items 陣列 + loadItems／addItem／togglePurchased／updateItem／deleteItem，只呼叫 shoppingListService
│   └── auth.js            # user／isLoggedIn + init／login／logout，只呼叫 authService
├── services/
│   ├── foodService.js         # store 與 repository 之間的欄位轉換層（詳細的表結構/RLS 見 documents/database.md）
│   ├── shoppingListService.js # 同上
│   └── authService.js         # 同上
├── views/
│   ├── Refrigerator.vue   # isLoading／errorMessage／deletingIds（陣列，防同一項目重複刪除），刪除前 confirm()
│   ├── FoodForm.vue       # isLoading／isSubmitting／errorMessage，新增與編輯共用同一個 handleSubmit，刪除前 confirm()
│   └── ShoppingList.vue   # isLoading／isAdding／isSavingEdit／togglingIds／deletingIds／editingId，並在 handleToggle() 裡跨 store 呼叫 useFoodStore()
├── components/
│   ├── FoodCard.vue         # 接收 deleting prop，刪除進行中時 disable 垃圾桶按鈕
│   └── ShoppingItemRow.vue  # 接收 editing／saving／toggling／deleting props，各自 disable 對應操作、不自己呼叫 store
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
