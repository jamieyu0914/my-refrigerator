# Database 結構文件

```
supabase/
└── migrations/
    ├── 20260905000000_init_schema.sql       # v1 schema：categories／profiles／foods／shopping_items／recipes／promotions，含 RLS 政策與 handle_new_user trigger
    └── 20260910000000_shopping_items_v2.sql # v2：shopping_items 改欄位（checked→purchased、added_at→created_at），新增 unit／category_code／updated_at（含 set_updated_at trigger）

src/
├── repositories/
│   ├── refrigeratorRepository.js  # foods 表的 dumb CRUD：getItems／getItemById／createItem／updateItem／deleteItem
│   ├── shoppingListRepository.js  # shopping_items 表的 dumb CRUD：getItems／createItem／updateItem／deleteItem
│   └── authRepository.js          # 包 supabase.auth.* 與 profiles 單筆查詢：fetchSession／signInWithPassword／signOutSession／subscribeToAuthChanges／fetchProfileById
├── services/
│   ├── supabaseClient.js        # 唯一建立 Supabase client 的地方，讀 VITE_SUPABASE_URL／VITE_SUPABASE_ANON_KEY，並提供 getCurrentUserId()
│   ├── authService.js           # 呼叫 authRepository，組成 toUser()（session + profiles.name）回傳給 stores/auth.js
│   ├── foodService.js           # 呼叫 refrigeratorRepository，做 category_code↔category／expiry_date↔expiryDate 等欄位轉換
│   └── shoppingListService.js   # 呼叫 shoppingListRepository，做 category_code↔category／purchased／unit／created_at↔createdAt／updated_at↔updatedAt 轉換
└── types/
    ├── user.js                  # User：id／email／name，對應 auth.users + profiles
    ├── food.js                  # Food：對應 foods 表
    ├── shoppingItem.js          # ShoppingItem：id／name／quantity／unit／category／purchased／createdAt／updatedAt，對應 shopping_items 表（v2 schema）
    └── recipe.js                # Recipe：對應 recipes 表（含 isFavorite）

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
        uuid user_id FK
        text title
        jsonb ingredients
        text instructions
        text image_url
        text_array tags
        boolean is_favorite
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

- 除 `categories` 外，每張表都有 `user_id` 指向 `auth.users` 並開 RLS，政策限制 `auth.uid() = user_id`（`profiles` 則是 `auth.uid() = id`）
- `foods`／`shopping_items`／`promotions` 三張表的 `category_code` 都是外鍵指到共用的 `categories.code`（v2 migration 把 `shopping_items` 也納入這個共用分類表）
- `recipes` 沒有跨使用者共用機制，`is_favorite` 是欄位而非關聯表
- 目前只有 `shopping_items` 有 `updated_at` 欄位與對應的 `set_updated_at()` trigger；其他表沒有這個機制

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

- **Schema 分兩份 migration**：`20260905000000_init_schema.sql` 定義六張表——`categories`（分類查表）、`profiles`（1:1 對應 `auth.users`，靠 `handle_new_user` trigger 自動建立）、`foods`（我的冰箱）、`shopping_items`（採買清單）、`recipes`（私有食譜，用 `is_favorite` 布林欄位取代多對多的最愛表）、`promotions`（私有的特價食材記錄）。`20260910000000_shopping_items_v2.sql` 後續改造 `shopping_items`：欄位改名（`checked`→`purchased`、`added_at`→`created_at`）、新增 `unit`／`category_code`（NOT NULL，用「先給預設值回填→轉 NOT NULL→拿掉預設值」三步驟安全遷移既有資料）／`updated_at`（配 `set_updated_at()` trigger 在每次 UPDATE 前自動寫入 `now()`）
- **repositories／services 兩層分工**：`src/repositories/*.js` 是唯一直接呼叫 `supabase.from(...)`／`supabase.auth.*` 的地方，函式是 dumb CRUD（raw snake_case 進出、零欄位轉換、零商業邏輯）；`src/services/*.js` 是唯一呼叫對應 repository 的地方，負責 snake_case↔camelCase 轉換、組出 `src/types/*.js` 形狀、以及 `getCurrentUserId()` 這類跨欄位的商業邏輯（見 `.claude/skills/database/SKILL.md`）。元件與 Pinia store 都不會直接碰資料庫
- **跨 domain 動作放在 View 層，不放在 store/service**：「採買清單勾選已購買→自動加入我的冰箱」這個行為，因為 `stores/shoppingList.js` 依規定只能呼叫 `shoppingListService`，不能碰 `foodService`／`foodStore`（見 `.claude/skills/backend/SKILL.md`），所以實作在 `src/views/ShoppingList.vue` 的 `handleToggle()`：先呼叫 `shoppingListStore.togglePurchased(id)`，成功後若「勾選前是未購買」才呼叫 `useFoodStore().addFood(...)`。取消勾選不會反向刪除冰箱裡的食材（已知限制：重新勾選會再新增一筆，不做防重複）
- **Auth 已完成串接**：`authService.js` 呼叫 `authRepository.js` 的 `fetchSession`／`signInWithPassword`／`signOutSession`／`subscribeToAuthChanges`，並用 `onAuthStateChange` 讓 session 過期或在別處登出時自動同步本地狀態；登入成功後用 `fetchProfileById` 查一次 `profiles` 表把 `name` 一併帶回來，組成 `User`（`types/user.js`）回傳給 `stores/auth.js`
- **Food／採買清單已完成串接**：`foodService.js`／`shoppingListService.js` 各自呼叫對應 repository，並做 `category_code`↔`category`、`expiry_date`↔`expiryDate`、`purchased`／`unit`、`created_at`↔`createdAt`／`updated_at`↔`updatedAt` 等欄位轉換；寫入時透過 `supabaseClient.js` 的 `getCurrentUserId()` 帶上 `user_id` 以符合 RLS 的 `with check`。`stores/food.js`／`stores/shoppingList.js` 的動作都是 async，各自有 `loadFoods()`／`loadItems()` 由對應頁面在 `onMounted` 呼叫；`FoodForm.vue` 編輯模式改成用 `fetchFood(id)` 直接向資料庫查單筆，不依賴列表快取
- **環境變數**：`VITE_SUPABASE_URL`／`VITE_SUPABASE_ANON_KEY` 放本機的 `.env`（已在 `.gitignore`，不會進版控），`.env.example` 提供欄位範本供新環境設定

## 本機設定：建立測試帳號並登入

目前 app **沒有註冊頁面**（`views/Login.vue` 只有登入表單，`authService.js` 沒有 `signUp`），第一個測試帳號要先在 Supabase 後台手動建立：

1. **建立/確認 Supabase 專案**：[supabase.com/dashboard](https://supabase.com/dashboard) 建立新專案（選 region、設資料庫密碼，等佈建完成）。
2. **設定環境變數**：Project Settings → API，複製 **Project URL** 與 **anon public** key；複製一份 `.env.example` 成 `.env`，填入 `VITE_SUPABASE_URL`／`VITE_SUPABASE_ANON_KEY`。
3. **套用 schema**：Dashboard 左側 **SQL Editor** → New query，依序貼上 `supabase/migrations/20260905000000_init_schema.sql`、再貼上 `20260910000000_shopping_items_v2.sql` 執行（或用 CLI：`supabase link` 後 `supabase db push` 會依檔名時間戳自動照順序套用）。沒跑這兩步的話 `auth.users` 有資料，但 `profiles`／`foods`／`shopping_items` 等表不存在或欄位是舊版（`checked`/`added_at`），登入後或存取採買清單會直接報錯。
4. **手動建立使用者**：Dashboard **Authentication → Users → Add user**，輸入 Email／密碼，**勾選「Auto Confirm User」**（跳過 email 驗證信，因為專案還沒設定寄信服務）。建立後，migration 裡的 `handle_new_user` trigger 會自動在 `profiles` 表建一筆對應資料（`name` 沒填時預設用 email `@` 前面那段）。
5. **登入**：`npm run dev`，開 `/login`，用剛建立的 Email／密碼登入。

之後若要讓使用者能在 app 內自行註冊（而不是每次都要進 Supabase 後台手動加），需要新增 `/register` 頁面 + `authService.signUp()`——這是目前還沒做的部分。
