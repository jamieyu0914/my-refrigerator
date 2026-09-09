# 本地開發文件

```
my-refrigerator/
├── index.html                  # Vite 進入點 HTML，掛載 <div id="app"> 並載入 src/main.js
├── vite.config.js              # Vite 設定：@vitejs/plugin-vue、build 時切換 GitHub Pages 子路徑、Vitest 設定（jsdom + globals）
├── package.json                # npm scripts（dev／build／preview／test）與相依套件
├── package-lock.json           # 鎖定版本，安裝時請用 npm ci 或 npm install
├── .env.example                 # VITE_SUPABASE_URL／VITE_SUPABASE_ANON_KEY 佔位範本
├── .env                         # 本機實際金鑰（已 gitignore，需自行建立，見 documents/database.md 的「本機設定」章節）
├── public/
│   └── favicon.svg              # 靜態資源，原樣複製到 build 輸出目錄
├── supabase/
│   └── migrations/              # Postgres schema migrations，依檔名時間戳依序套用（詳見 documents/database.md）
├── .github/
│   └── workflows/deploy.yml     # push 到 main 時自動 build 並部署到 GitHub Pages
└── src/                         # 前端結構見 documents/frontend.md，store/service 資料流見 documents/backend.md，schema/repository 見 documents/database.md
```

## 環境需求

- Node.js（本機驗證版本：v24.7.0，建議使用 18+ 的 LTS 版本即可執行 Vite 8）
- npm（本機驗證版本：11.5.1）
- **需要一組可用的 Supabase 專案**：專案已接上真正的後端（Supabase Postgres + Auth），`.env` 必須設定 `VITE_SUPABASE_URL`／`VITE_SUPABASE_ANON_KEY` 才能啟動——沒有這組金鑰，`src/services/supabaseClient.js` 建立的 client 無法連線，登入與所有資料讀寫都會失敗。建立步驟見 `documents/database.md`「本機設定：建立測試帳號並登入」

## 安裝與啟動

```bash
# 0. 第一次設定：複製一份 .env.example 成 .env，填入 Supabase 專案的 URL／anon key
cp .env.example .env

# 1. 安裝相依套件（第一次 clone 下來，或 package-lock.json 有變動時執行）
npm install

# 2. 啟動本地開發伺服器（Vite，預設 http://localhost:5173，含熱更新 HMR）
npm run dev

# 3. 執行測試（Vitest）
npm run test

# 4. 打包正式版（輸出到 dist/）
npm run build

# 5. 在本地預覽 build 後的結果（預設 http://localhost:4173）
npm run preview
```

執行 `npm run dev` 後，終端機會顯示實際的本地網址（若 5173 被占用，Vite 會自動換下一個可用埠號），用瀏覽器打開該網址即可看到頁面；但要能實際登入、看到資料，`.env` 必須先設定好且已在 Supabase 專案套用過 `supabase/migrations/` 裡的 schema。

## 重點功能

- **啟動指令來源**：`package.json` 的 `scripts` 定義了 `dev`（`vite`）、`build`（`vite build`）、`preview`（`vite preview`）、`test`（`vitest run`）四個指令，皆透過 `npm run <script>` 執行
- **Vite 設定**：`vite.config.js` 用 `defineConfig` 套用 `@vitejs/plugin-vue`；`base` 依 `command === 'build'` 切換——本機開發維持根路徑 `/`，正式 build 改成 `/my-refrigerator/`（GitHub Pages 專案頁面部署在這個子路徑下）；同一份設定檔的 `test` 區塊（`environment: 'jsdom'`、`globals: true`）供 Vitest 使用，不用另開 `vitest.config.js`
- **需要真正的後端**：跟以前的版本不同，現在專案**不能**單靠前端獨立跑起來——`src/services/supabaseClient.js` 用 `.env` 的 `VITE_SUPABASE_URL`／`VITE_SUPABASE_ANON_KEY` 建立 Supabase client，登入（`authService.js`）與所有 CRUD（`foodService.js`／`shoppingListService.js`）都真的會打 API，沒設定好 `.env` 或還沒在 Supabase 專案套用 migration，啟動後操作任何功能都會報錯
- **測試**：`vitest` + `@vue/test-utils`，測試檔統一放在各層旁邊的 `__tests__/`（例如 `src/services/__tests__/`、`src/stores/__tests__/`、`src/views/__tests__/`），用 `vi.mock()` 隔開下一層依賴（service 測試 mock repository、store 測試 mock service、View 測試 mock store），`npm run test` 一次跑全部
- **部署**：`.github/workflows/deploy.yml` 在 push 到 `main` 分支時自動觸發，跑 `npm ci` → `npm run build`（build 時把 GitHub repo secrets 的 `VITE_SUPABASE_URL`／`VITE_SUPABASE_ANON_KEY` 注入成環境變數）→ 把 `dist/` 上傳並部署到 GitHub Pages；也可以在 GitHub Actions 頁面用 `workflow_dispatch` 手動觸發
- **靜態資源**：`public/` 內的檔案（如 `favicon.svg`）在 `npm run dev`／`npm run build` 時會直接以原始路徑提供，`index.html` 透過 `/favicon.svg` 引用
