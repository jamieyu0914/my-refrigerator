# Database 結構文件

```
supabase/
└── migrations/
    ├── 20260905000000_init_schema.sql       # v1 schema：categories／profiles／foods／shopping_items／recipes／promotions，含 RLS 政策與 handle_new_user trigger
    ├── 20260910000000_shopping_items_v2.sql # v2：shopping_items 改欄位（checked→purchased、added_at→created_at），新增 unit／category_code／updated_at（含 set_updated_at trigger）
    ├── 20260910010000_recipe_details.sql    # v3：recipes 新增 cook_time_minutes／difficulty／description／updated_at（重用 set_updated_at trigger），把 ingredients(jsonb)／instructions(text) 正規化成 recipe_ingredients／recipe_steps 兩張子表（含資料搬移＋drop 舊欄位）
    ├── 20260910020000_seed_recipes.sql       # 純資料 migration：對 auth.users 裡每個既有使用者各灌一份 100 筆種子食譜（含 recipe_ingredients／recipe_steps），不改 schema
    └── 20260910030000_shared_recipes_favorites.sql # v4：recipes 從「每人私有」改成「大家共用的食譜庫」——select 開放給所有登入使用者，insert/update/delete 限建立者；recipe_ingredients／recipe_steps 的 RLS 同樣拆成「select 開放／寫入限建立者」；新增 favorite_recipes(user_id, recipe_id) 多對多關聯表取代 recipes.is_favorite（含資料搬移＋drop 舊欄位）

src/
├── repositories/
│   ├── refrigeratorRepository.js  # foods 表的 dumb CRUD：getItems／getItemById／createItem／updateItem／deleteItem
│   ├── shoppingListRepository.js  # shopping_items 表的 dumb CRUD：getItems／createItem／updateItem／deleteItem
│   ├── recipeRepository.js        # recipes／recipe_ingredients／recipe_steps 三張表的 dumb CRUD：getItems(userId)／getItemById(id, userId)（都用 Supabase FK embed 帶出 favorite_recipes(user_id)，getItemById 再加 recipe_ingredients／recipe_steps）／createItem／createIngredients／createSteps／updateItem／deleteItem／deleteIngredients(recipeId)／deleteSteps(recipeId)
│   ├── favoriteRecipeRepository.js # favorite_recipes 表的 dumb CRUD：createFavorite(row)／deleteFavorite(userId, recipeId)
│   └── authRepository.js          # 包 supabase.auth.* 與 profiles 單筆查詢：fetchSession／signInWithPassword／signOutSession／subscribeToAuthChanges／fetchProfileById
├── services/
│   ├── supabaseClient.js        # 唯一建立 Supabase client 的地方，讀 VITE_SUPABASE_URL／VITE_SUPABASE_ANON_KEY，並提供 getCurrentUserId()
│   ├── authService.js           # 呼叫 authRepository，組成 toUser()（session + profiles.name）回傳給 stores/auth.js
│   ├── foodService.js           # 呼叫 refrigeratorRepository，做 category_code↔category／expiry_date↔expiryDate 等欄位轉換
│   ├── shoppingListService.js   # 呼叫 shoppingListRepository，做 category_code↔category／purchased／unit／created_at↔createdAt／updated_at↔updatedAt 轉換
│   └── recipeService.js         # 同時呼叫 recipeRepository 與 favoriteRecipeRepository（食譜這個 domain 本來就橫跨好幾張表），做 image_url↔imageUrl／cook_time_minutes↔cookTimeMinutes／created_at↔createdAt／updated_at↔updatedAt 轉換；isFavorite 改成從 embed 回來的 favorite_recipes 陣列是否非空推導（不是欄位），isOwn 則是比對 row.user_id 是否等於目前使用者 id；fetchRecipes／fetchRecipeById 都要先 getCurrentUserId() 再把 userId 傳給 repository 過濾 embed；updateRecipe(id, updates) 若 updates 帶了 ingredients／steps，會先刪掉該 recipe 底下所有舊的子表資料再整批重新 insert（不做逐筆 diff／update）；deleteRecipe(id) 直接刪 recipes 一列，子表靠 on delete cascade 自動清掉；toggleFavorite(recipeId, currentValue) 依 currentValue 呼叫 createFavorite／deleteFavorite，再 fetchRecipeById 回傳最新物件
└── types/
    ├── user.js                  # User：id／email／name，對應 auth.users + profiles
    ├── food.js                  # Food：對應 foods 表
    ├── shoppingItem.js          # ShoppingItem：id／name／quantity／unit／category／purchased／createdAt／updatedAt，對應 shopping_items 表（v2 schema）
    ├── recipe.js                # Recipe：id／title／imageUrl／cookTimeMinutes／difficulty／description／tags／isFavorite／isOwn／createdAt／updatedAt，對應 recipes 表；isOwn 是「這份食譜是不是目前使用者建立的」，只用來控制編輯/刪除按鈕要不要顯示；ingredients／steps 只有查詳情（fetchRecipeById）時才會有值
    ├── recipeIngredient.js      # RecipeIngredient：id／name／amount／sortOrder，對應 recipe_ingredients 表
    └── recipeStep.js            # RecipeStep：id／description／sortOrder，對應 recipe_steps 表

.env.example                     # VITE_SUPABASE_URL／VITE_SUPABASE_ANON_KEY 佔位範本，實際值放 .env（已 gitignore）
```

## 資料庫架構圖

### ER 圖（資料表關聯）

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "id = id"
    AUTH_USERS ||--o{ FOODS : "id = user_id"
    AUTH_USERS ||--o{ SHOPPING_ITEMS : "id = user_id"
    AUTH_USERS ||--o{ RECIPES : "id = user_id"
    AUTH_USERS ||--o{ PROMOTIONS : "id = user_id"
    RECIPES ||--o{ RECIPE_INGREDIENTS : "id = recipe_id"
    RECIPES ||--o{ RECIPE_STEPS : "id = recipe_id"
    AUTH_USERS ||--o{ FAVORITE_RECIPES : "id = user_id"
    RECIPES ||--o{ FAVORITE_RECIPES : "id = recipe_id"
    CATEGORIES ||--o{ FOODS : "code = category_code"
    CATEGORIES ||--o{ SHOPPING_ITEMS : "code = category_code"
    CATEGORIES ||--o{ PROMOTIONS : "code = category_code"

    AUTH_USERS {
        uuid id PK "Supabase Auth 管理"
    }
    PROFILES {
        uuid id PK "同時是 auth.users 的 FK"
        text name
        timestamptz created_at
    }
    CATEGORIES {
        text code PK "蔬果／肉類／乳製品／飲品／其他"
        text label
        int sort_order
    }
    FOODS {
        uuid id PK
        uuid user_id FK
        text name
        text category_code FK
        int quantity
        date expiry_date
        timestamptz added_at
    }
    SHOPPING_ITEMS {
        uuid id PK
        uuid user_id FK
        text name
        int quantity
        text unit "選填，例如「盒」「瓶」"
        text category_code FK
        boolean purchased
        timestamptz created_at
        timestamptz updated_at "shopping_items_set_updated_at trigger 自動維護"
    }
    RECIPES {
        uuid id PK
        uuid user_id FK "建立者，不是唯一擁有者——select 對所有人開放"
        text title
        text image_url
        int cook_time_minutes "選填"
        text difficulty "選填，簡單／普通／困難"
        text description "選填"
        text_array tags
        timestamptz created_at
        timestamptz updated_at "recipes_set_updated_at trigger 自動維護"
    }
    RECIPE_INGREDIENTS {
        uuid id PK
        uuid recipe_id FK
        text name
        text amount "自由文字，例如「3 顆」「少許」"
        int sort_order
    }
    RECIPE_STEPS {
        uuid id PK
        uuid recipe_id FK
        text description
        int sort_order
    }
    FAVORITE_RECIPES {
        uuid user_id PK "複合主鍵 (user_id, recipe_id)"
        uuid recipe_id PK
        timestamptz created_at
    }
    PROMOTIONS {
        uuid id PK
        uuid user_id FK
        text name
        text category_code FK
        numeric original_price
        numeric discount_price
        text store
        date valid_from
        date valid_until
        text image_url
        timestamptz created_at
    }
```

- 除 `categories`／`recipes` 外，每張表都有 `user_id` 指向 `auth.users` 並開 RLS，政策限制 `auth.uid() = user_id`（`profiles` 則是 `auth.uid() = id`）——`recipes` 是例外：`select` 對所有登入使用者開放（大家共用的食譜庫），只有 `insert`／`update`／`delete` 限制 `auth.uid() = user_id`（`user_id` 語意是「建立者」，不是「唯一擁有者」）
- `foods`／`shopping_items`／`promotions` 三張表的 `category_code` 都是外鍵指到共用的 `categories.code`（v2 migration 把 `shopping_items` 也納入這個共用分類表）
- `recipes` 現在是共用食譜庫；「最愛」不是欄位而是 `favorite_recipes(user_id, recipe_id)` 這張真正的多對多關聯表（複合主鍵，天生防止同一人對同一份食譜重複收藏），RLS 限制 `auth.uid() = user_id`——每個人只能新增/查詢/刪除自己的收藏關聯，但可以收藏任何人建立的食譜
- `recipe_ingredients`／`recipe_steps` 是 `recipes` 的一對多子表，兩張表都沒有自己的 `user_id`——`select` 對所有登入使用者開放（母食譜本身已公開），`insert`／`update`／`delete` 各自用 `exists (select 1 from recipes where recipes.id = recipe_ingredients.recipe_id and recipes.user_id = auth.uid())` 這種子查詢把寫入權限跟著父表的建立者走，而不是每張子表都重複存一份 `user_id`
- `shopping_items`／`recipes` 有 `updated_at` 欄位與對應的 `set_updated_at()` trigger（兩張表共用同一個 trigger function）；其他表沒有這個機制

### 資料存取分層（元件永遠不直接呼叫 Supabase）

```mermaid
flowchart LR
    V["Views / Components\n(Refrigerator.vue、ShoppingList.vue…)"] --> S["Pinia stores\n(stores/food.js、stores/shoppingList.js、stores/auth.js)"]
    S --> SV["src/services/*.js\n(foodService、shoppingListService、authService)"]
    SV --> R["src/repositories/*.js\n(refrigeratorRepository、shoppingListRepository、authRepository)"]
    R --> C["supabaseClient.js\n(唯一 createClient 實例 + getCurrentUserId())"]
    C --> DB[("Supabase\nPostgres + Auth + RLS")]
```

## 重點功能

- **Schema 分四份 migration（外加一份純資料 migration）**：`20260905000000_init_schema.sql` 定義六張表——`categories`（分類查表）、`profiles`（1:1 對應 `auth.users`，靠 `handle_new_user` trigger 自動建立）、`foods`（我的冰箱）、`shopping_items`（採買清單）、`recipes`（原本是私有食譜，用 `is_favorite` 布林欄位取代多對多的最愛表）、`promotions`（私有的特價食材記錄）。`20260910000000_shopping_items_v2.sql` 後續改造 `shopping_items`：欄位改名（`checked`→`purchased`、`added_at`→`created_at`）、新增 `unit`／`category_code`（NOT NULL，用「先給預設值回填→轉 NOT NULL→拿掉預設值」三步驟安全遷移既有資料）／`updated_at`（配 `set_updated_at()` trigger 在每次 UPDATE 前自動寫入 `now()`）。`20260910010000_recipe_details.sql` 再改造 `recipes`：新增 `cook_time_minutes`／`difficulty`（`check` 限制在簡單／普通／困難）／`description`／`updated_at`（重用同一個 `set_updated_at()` trigger function），並把原本 `ingredients`（jsonb 字串陣列）／`instructions`（單一文字）兩欄，用「先把既有資料搬進新子表 → 再 drop 舊欄位」的安全順序，正規化成 `recipe_ingredients`／`recipe_steps` 兩張一對多子表。`20260910020000_seed_recipes.sql` 是純資料（不改 schema），對當時已存在的每個使用者各灌一份 100 筆種子食譜。`20260910030000_shared_recipes_favorites.sql` 是最大的一次調整：把 `recipes`／`recipe_ingredients`／`recipe_steps` 的 RLS 從「全操作限本人」拆成「select 開放給所有登入使用者、insert/update/delete 限建立者」，並新增 `favorite_recipes(user_id, recipe_id)` 多對多關聯表取代 `is_favorite` 欄位（先把既有 `is_favorite = true` 的資料搬進新表，再 drop 欄位；不做跨使用者的食譜去重，因為沒有可靠依據判斷「哪些是同一份食譜」）
- **`recipe_ingredients`／`recipe_steps` 用 `sort_order` 維持順序**：兩張子表都沒有自己的時間戳或 `user_id`，純粹是 `recipes` 底下有序的子資源；新增食譜時前端陣列的索引位置就是寫入的 `sort_order`，查詢時 service 再依 `sort_order` 排序還原順序（見 `recipeService.js` 的 `toRecipe()`）
- **repositories／services 兩層分工**：`src/repositories/*.js` 是唯一直接呼叫 `supabase.from(...)`／`supabase.auth.*` 的地方，函式是 dumb CRUD（raw snake_case 進出、零欄位轉換、零商業邏輯）；`src/services/*.js` 是唯一呼叫對應 repository 的地方，負責 snake_case↔camelCase 轉換、組出 `src/types/*.js` 形狀、以及 `getCurrentUserId()` 這類跨欄位的商業邏輯（見 `.claude/skills/database/SKILL.md`）。元件與 Pinia store 都不會直接碰資料庫
- **跨 domain 動作放在 View 層，不放在 store/service**：「採買清單勾選已購買→自動加入我的冰箱」這個行為，因為 `stores/shoppingList.js` 依規定只能呼叫 `shoppingListService`，不能碰 `foodService`／`foodStore`（見 `.claude/skills/backend/SKILL.md`），所以實作在 `src/views/ShoppingList.vue` 的 `handleToggle()`：先呼叫 `shoppingListStore.togglePurchased(id)`，成功後若「勾選前是未購買」才呼叫 `useFoodStore().addFood(...)`。取消勾選不會反向刪除冰箱裡的食材（已知限制：重新勾選會再新增一筆，不做防重複）
- **Auth 已完成串接**：`authService.js` 呼叫 `authRepository.js` 的 `fetchSession`／`signInWithPassword`／`signOutSession`／`subscribeToAuthChanges`，並用 `onAuthStateChange` 讓 session 過期或在別處登出時自動同步本地狀態；登入成功後用 `fetchProfileById` 查一次 `profiles` 表把 `name` 一併帶回來，組成 `User`（`types/user.js`）回傳給 `stores/auth.js`
- **Food／採買清單已完成串接**：`foodService.js`／`shoppingListService.js` 各自呼叫對應 repository，並做 `category_code`↔`category`、`expiry_date`↔`expiryDate`、`purchased`／`unit`、`created_at`↔`createdAt`／`updated_at`↔`updatedAt` 等欄位轉換；寫入時透過 `supabaseClient.js` 的 `getCurrentUserId()` 帶上 `user_id` 以符合 RLS 的 `with check`。`stores/food.js`／`stores/shoppingList.js` 的動作都是 async，各自有 `loadFoods()`／`loadItems()` 由對應頁面在 `onMounted` 呼叫；`FoodForm.vue` 編輯模式改成用 `fetchFood(id)` 直接向資料庫查單筆，不依賴列表快取
- **食譜是共用食譜庫，最愛是多對多關聯**：`recipeService.js` 同時呼叫 `recipeRepository.js`（`recipes`／`recipe_ingredients`／`recipe_steps`）與 `favoriteRecipeRepository.js`（`favorite_recipes`）；`fetchRecipes`（列表，不含子表）／`fetchRecipeById`（詳情，用 Supabase FK embed 帶出 `recipe_ingredients`／`recipe_steps`）都先 `getCurrentUserId()`，再把 userId 傳進 repository 用來過濾內嵌的 `favorite_recipes(user_id)`——這是 PostgREST 的標準寫法：`.eq('favorite_recipes.user_id', userId)` 只會篩選內嵌陣列的內容，不會把沒收藏的食譜整列排除，`isFavorite` 就是看這個內嵌陣列是不是非空；`toggleFavorite(recipeId, currentValue)` 依 `currentValue` 呼叫 `createFavorite`／`deleteFavorite` 新增或刪除一筆關聯，再 `fetchRecipeById` 回傳最新物件。`insertRecipe` 新增流程不變（recipe → recipe_ingredients → recipe_steps → 重新查一次）
- **食譜編輯／刪除已接上，靠原本就備好的 RLS**：`recipeService.updateRecipe(id, updates)` 更新 `recipes` 本體欄位，若 `updates` 帶 `ingredients`／`steps` 就先 `deleteIngredients`／`deleteSteps` 整批刪光再重新 `createIngredients`／`createSteps`（不是逐筆比對更新，簡單但每次編輯都是整批換掉）；`deleteRecipe(id)` 直接刪 `recipes` 一列，靠 `on delete cascade` 自動清掉該食譜的 `recipe_ingredients`／`recipe_steps`／`favorite_recipes`（包括別人對這份食譜的收藏）。RLS 在 `20260910030000_shared_recipes_favorites.sql` 就已經把 update/delete 限制在 `auth.uid() = user_id`（建立者），這次應用層只是把已經存在的資料庫權限接上 UI，沒有新增 migration
- **環境變數**：`VITE_SUPABASE_URL`／`VITE_SUPABASE_ANON_KEY` 放本機的 `.env`（已在 `.gitignore`，不會進版控），`.env.example` 提供欄位範本供新環境設定

## 本機設定：建立測試帳號並登入

目前 app **沒有註冊頁面**（`views/Login.vue` 只有登入表單，`authService.js` 沒有 `signUp`），第一個測試帳號要先在 Supabase 後台手動建立：

1. **建立/確認 Supabase 專案**：[supabase.com/dashboard](https://supabase.com/dashboard) 建立新專案（選 region、設資料庫密碼，等佈建完成）。
2. **設定環境變數**：Project Settings → API，複製 **Project URL** 與 **anon public** key；複製一份 `.env.example` 成 `.env`，填入 `VITE_SUPABASE_URL`／`VITE_SUPABASE_ANON_KEY`。
3. **套用 schema**：Dashboard 左側 **SQL Editor** → New query，依序貼上 `supabase/migrations/` 底下所有檔案（依檔名時間戳排序：`init_schema` → `shopping_items_v2` → `recipe_details` → `seed_recipes`（選填，純示範資料）→ `shared_recipes_favorites`）執行（或用 CLI：`supabase link` 後 `supabase db push` 會自動照順序套用）。沒跑完的話 `auth.users` 有資料，但 `profiles`／`foods`／`shopping_items`／`recipes`／`favorite_recipes` 等表不存在或欄位是舊版，登入後或存取採買清單／食譜會直接報錯。
4. **手動建立使用者**：Dashboard **Authentication → Users → Add user**，輸入 Email／密碼，**勾選「Auto Confirm User」**（跳過 email 驗證信，因為專案還沒設定寄信服務）。建立後，migration 裡的 `handle_new_user` trigger 會自動在 `profiles` 表建一筆對應資料（`name` 沒填時預設用 email `@` 前面那段）。
5. **登入**：`npm run dev`，開 `/login`，用剛建立的 Email／密碼登入。

之後若要讓使用者能在 app 內自行註冊（而不是每次都要進 Supabase 後台手動加），需要新增 `/register` 頁面 + `authService.signUp()`——這是目前還沒做的部分。
